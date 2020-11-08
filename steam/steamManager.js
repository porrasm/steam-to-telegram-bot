const User = require('steam-user')
const chatBot = require('./steamChatBot')
let client = new User()
var SteamTotp = require('steam-totp');
const timer = require('../tools/timer');
const logger = require('../logger');
const telegramBot = require('../telegram/telegramBot');

const steamSecret = process.env.STEAM_SECRET

global.SteamUser = User
global.steamManager = this
global.steamClient = client

const getClient = () => {
    return client
}

const autologin = () => {
    const user = process.env.STEAM_USER
    const pass = process.env.STEAM_PASSWORD
    login(user, pass, getCode())
}
const login = (accountName, password, twoFactorCode) => {

    console.log("Call login: ", new Error().stack)

    logger.log("Logging in...", {
        accountName,
        password: "password",
        twoFactorCode
    })

    const loginOptions = {accountName, password, twoFactorCode}
    
    client.logOn(loginOptions)
    steamClient = client

    if (settings.informLogin) {
        telegramBot.sendBotMessage('Trying to log in as user: ' + accountName)
    }
}

const logout = async () => {
    if (steamClient != null) {
        steamClient.logOff()  
    }
    await timer(5000)
    global.steamClient = null
}

const getCode = () => {
    return SteamTotp.generateAuthCode(steamSecret);
}

const getChatBot = () => {
    return chatBot
}

//#region tools
const getPersona = (steamID) => {
    return new Promise((resolve, reject)=> {
        steamClient.getPersonas([steamID]).then((res) => {
            try {
                const p = res.personas[steamID]
                resolve(p)
            } catch(e) {
                reject()
            }
        })
    })
}
//#endregion

const init = () => {
    
    client.on('loggedOn', function(details) {
        logger.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
        logger.log('Login details', details)
        client.setPersona(settings.defaultSteamState);
        if (settings.informLogin) {
            telegramBot.sendBotMessage('Succesfully logged in to Steam')
        }
    });
    
    client.on('error', function(e) {
        // Some error occurred during logon
        logger.log("Error logging in", {
            accountName,
            password: "password",
            twoFactorCode,
            e
        })
        telegramBot.sendBotMessage("Error logging in on Steam as user: " + accountName)
    });

    chatBot.startChatBot()
}

init()

module.exports = {
    getClient,
    autologin,
    login,
    logout,
    getChatBot,
    getPersona,
    getCode
}