const User = require('steam-user')
const chatBot = require('./steamChatBot')
let client = new User()
var SteamTotp = require('steam-totp');
const timer = require('../tools/timer');
const telegramBot = require('../telegram/telegramBot');

const steamSecret = process.env.STEAM_SECRET

global.SteamUser = User
global.steamManager = this
global.steamClient = null

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

    client = new User()
    const apiKey = process.env.STEAM_API_KEY

    logger.log("Logging in...", {
        accountName,
        password: "password",
        twoFactorCode
    })

    const loginOptions = {accountName, password, twoFactorCode}
    
    client.logOn(loginOptions)

    client.on('loggedOn', function(details) {
        logger.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
        // client.setPersona(SteamUser.EPersonaState.Online);
        chatBot.startChatBot()
        telegramBot.sendMessage("Logged in on Steam as user: ", accountName)
    });
    
    client.on('error', function(e) {
        // Some error occurred during logon
        logger.log("Error logging in", {
            accountName,
            password: "password",
            twoFactorCode,
            e
        })
        telegramBot.sendMessage("Error logging in on Steam as user: ", accountName)
    });

    steamClient = client
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

module.exports = {
    getClient,
    autologin,
    login,
    logout,
    getChatBot,
    getPersona
}