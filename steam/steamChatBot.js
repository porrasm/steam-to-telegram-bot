const logger = require('../logger');
let telegramBot = null

const startChatBot = () => {
    steamClient.on('friendMessage', function (steamID, message) {

        logger.log("Received Steam message", {
            steam_id: steamID.getSteam3RenderedID(),
            message: message
        });

        receiveMessage(steamID, message)
    });

    global.sendMessage = sendMessage
}

const receiveMessage = (steamID, message) => {
    sendMessage(steamID, "Received your message: " + message)
    telegramBot.sendMessageToSelf(message, steamID)
}

const sendMessage = (steamID, message) => {
    try {
        logger.log("Sending Steam message to recipient", {
            to: steamID,
            message
        })
        steamClient.chatMessage(steamID, message)
    } catch(e) {
        logger.log('Error sending Steam message', e.message)
    }
}

const setTelegramBot = (bot) => {
    telegramBot = bot
}

module.exports = {
    startChatBot,
    sendMessage,
    setTelegramBot
}