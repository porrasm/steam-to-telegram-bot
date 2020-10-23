const TelegramBot = require('node-telegram-bot-api');
const logger = require('../logger');
let steamChatBot = null

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

    if (msg.reply_to_message) {
        onReplyToMessage(msg)
        return
    }
});

const onReplyToMessage = (msg) => {

    const steamID = getSteamIDFromReply(msg.reply_to_message.text)
    const text = msg.text

    if (!steamID) {
        return
    }

    logger.log("Replying to Steam message", {steamID, text})

    steamChatBot.sendMessage(steamID, text)
}
const getSteamIDFromReply = (text) => {

    let split = text.split(": ")
    if (split.length < 1) {
        return null
    }

    split = split[1].split("\n")
    return split[0]
}

bot.onReplyToMessage(chatID, null, (msg) => {
    logger.log('Reply to message', msg)
})
//#endregion

//#region steam integration

const sendSteamMessageToTelegram = (message, steamID, nickname) => {
    if (!chatID) {
        logger.log("Received message but chatID is null", message)
        return
    }

    const toSend = steamID == null ? message : encapsulateMessage(message, steamID, nickname, "Steam")

    bot.sendMessage(chatID, toSend, {parse_mode: "Markdown"}).then(sent => {
        if (steamID) {
            logger.log('Forwarded Steam message to Telegram', sent.text)
        }
    })
}

const encapsulateMessage = (message, senderID, nickname, messageType) => {
    return "`(" + messageType + ") " + nickname + " : " + senderID + "`\n" + message
}
//#endregion

const invalidState = (msg, checkOnlyUser) => {
    if (msg.chat.username != username) {
        logger.log("Received message from incorrect user", msg.chat)
        bot.sendMessage(msg.chat.id, 'Sorry. This is a private bot. In order to use it yourself you have to configure it manually. Check github_link for more info.');
        return true
    } else {
        // proper init command???
        
        if (chatID != msg.chat.id) {
            chatID = msg.chat.id
            bot.sendMessage(msg.chat.id, 'Welcome! Initialized bot with current chat id: ' + chatID);
        }
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

const setSteamChatBot = (bot) => {
    steamChatBot = bot
}

module.exports = {
    sendSteamMessageToTelegram,
    setSteamChatBot
}