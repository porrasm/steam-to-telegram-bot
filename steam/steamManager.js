const User = require('steam-user')
const chatBot = require('./steamChatBot')
const client = new User()

global.SteamUser = User
global.steamClient = null

const getClient = () => {
    return client
}

const login = (accountName, password, twoFactorCode) => {
    const client = new User()
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
    });
    
    client.on('error', function(e) {
        // Some error occurred during logon
        logger.log("Error logging in", {
            accountName,
            password: "password",
            twoFactorCode,
            e
        })     
    });

    steamClient = client
}

module.exports = {
    getClient,
    login
}