const logger = require('./logger')
global.logger = require('./logger')
require('dotenv').config()
const server = require('./server')
const jsonFiles = require('./tools/jsonFiles')

const main = async () => {

    let settings = await jsonFiles.loadSettings()
    if (!settings) {
        settings = defaultSettings()
    }

    global.settings = settings
    global.steamManager = require('./steam/steamManager')

    if (process.argv.length >= 5) {
        steamManager.login(process.argv[2], process.argv[3], process.argv[4])
    } else if (checkAutoLogin()) {
        steamManager.autologin()
    } else {
        logger.log('Not enough arguments. Not logging in.')
    }

    global.telegramBot = require('./telegram/telegramBot')

    let chatBot = steamManager.getChatBot()
    telegramBot.setSteamChatBot(chatBot)
    chatBot.setTelegramBot(telegramBot)

    if (process.env.SERVER_PORT != null) {
        server.createServer()
    } else {
        logger.log('Server port not defined in the .env file. The app won\'t create a web interface.')
    }
}

const checkAutoLogin = () => {
    const user = process.env.STEAM_USER
    const pass = process.env.STEAM_PASSWORD
    const secret = process.env.STEAM_SECRET

    return user != null && pass != null && secret != null && settings.useAutoLogin
}

const defaultSettings = () => {
    return {
        chatID: null,
        defaultSteamState: 'Offline',
        useAutoLogin: true,
        useAutoReply: true,
        relayStringMatch: '//',
        informLogin: true,
        guestPower: 0
    }
}

logger.log('Starting application...')

main()