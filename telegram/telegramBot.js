const TelegramBot = require('node-telegram-bot-api');
const logger = require('../logger');
const steamChatBot = require('../steam/steamChatBot')

let chatID = null
const username = process.env.TELEGRAM_USER
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {polling: true})

//#region  commands
bot.onText(/\/quit/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    logger.log('Stop bot')

    return
    bot.stopPolling()
    bot.sendMessage(msg.chat.id, 'Stopping the bot. Goodbye!')
    process.exit(0)
});


bot.on('message', (msg) => {

    if (invalidState(msg)) {
        return
    }

    const chatId = msg.chat.id;
   
    logger.log("Received message", {message: msg.chat})

    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Received your message');
});

bot.onReplyToMessage(chatID, null, (msg) => {
    logger.log('Reply to message', msg)
})
//#endregion

//#region steam integration

const sendMessageToSelf = (message, steamID) => {
    if (!chatID) {
        logger.log("Received message but chatID is null", message)
        return
    }

    const toSend = steamID == null ? message : encapsulateMessage(steamID, message)

    bot.sendMessage(chatID, toSend).then(sent => {
        if (steamID) {
            logger.log('Forwarded Steam message to Telegram', sent.text)
            bot.onReplyToMessage(chatID, sent.message_id, (res) => {
                logger.log("Received reply to Steam message on Telegram. Forwarding reply to Steam", res.text)
                try {
                    steamChatBot.sendMessage(steamID, res.text)
                } catch (error) {
                    logger.log("Error forwarding Telegram reply to Steam", error.message)
                }
            })
        }
    })
}

const encapsulateMessage = (sender, message) => {
    return "Received Steam message from: " + sender + "\n\n" + message
}
//#endregion

const invalidState = (msg, checkOnlyUser) => {
    if (msg.chat.username != username) {
        logger.log("Received message from incorrect user", msg.chat)
        bot.sendMessage(msg.chat.id, 'Sorry. This is a private bot. In order to use it yourself you have to configure it manually. Check github_link for more info.');
        return true
    } else {
        // proper init command???
        chatID = msg.chat.id
    }

    if (checkOnlyUser) {
        return false
    }

    if (steamClient == null) {
        bot.sendMessage(msg.chat.id, 'Sorry. You are currently not logged in to Steam.');
        return true
    }

    return false
}

module.exports = {
    sendMessageToSelf
}