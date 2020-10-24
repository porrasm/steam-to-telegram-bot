const logger = require('./logger')
global.logger = require('./logger')
require('dotenv').config()
const server = require('./server')
const steamManager = require('./steam/steamManager')

const main = () => {

    global.steamManager = require('./steam/steamManager')

    if (process.argv.length >= 5) {
        steamManager.login(process.argv[2], process.argv[3], process.argv[4])
    } else if (checkAutoLogin()) {
        steamManager.autologin()
    } else {
        logger.log("Not enough arguments. Not logging in.")
    }

    const telegramBot = require('./telegram/telegramBot')

    let chatBot = steamManager.getChatBot()
    telegramBot.setSteamChatBot(chatBot)
    chatBot.setTelegramBot(telegramBot)

    server.createServer()
}

const checkAutoLogin = () => {
    const user = process.env.STEAM_USER
    const pass = process.env.STEAM_PASSWORD
    const secret = process.env.STEAM_SECRET

    return user != null && pass != null && secret != null
}

logger.log("Starting application...")

main()