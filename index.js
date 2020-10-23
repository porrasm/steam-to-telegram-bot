const logger = require('./logger')
global.logger = require('./logger')
require('dotenv').config()

const main = () => {

    const steam = require('./steam/steamManager')

    if (process.argv.length >= 5) {
        steam.login(process.argv[2], process.argv[3], process.argv[4])
    } else {
        logger.log("Not enough arguments. Not autologging in.")
    }

    const telegramBot = require('./telegram/telegramBot')

    let chatBot = steam.getChatBot()
    telegramBot.setSteamChatBot(chatBot)
    chatBot.setTelegramBot(telegramBot)


}

logger.log("Starting application...")

main()