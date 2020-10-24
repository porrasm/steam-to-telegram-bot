const TelegramBot = require('node-telegram-bot-api');
const logger = require('../logger');
const steamManager = require('../steam/steamManager');
let steamChatBot = null

let chatID = null
const username = process.env.TELEGRAM_USER
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {polling: true})

const startTime = new Date().getUTCMilliseconds()

let lastSteamID = null

//#region  commands
bot.onText(/\/status/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const statusString = `\`Bot status:\nRunning time: ${new Date().getHours() - startTime / 3600}\``
});

bot.onText(/\/code/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    bot.sendMessage(msg.chat.id, steamManager.getCode())
});

bot.onText(/\/online/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Online)
    bot.sendMessage(msg.chat.id, "Set you online on Steam")
});

bot.onText(/\/offline/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Offline)
    bot.sendMessage(msg.chat.id, "Set you offline on Steam")
});


bot.onText(/\/quit/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    logger.log('Stop bot')

    bot.stopPolling()
    bot.sendMessage(msg.chat.id, 'Stopping the bot. Goodbye!').then(r => {
        process.exit(0)
    })
});


bot.on('message', (msg) => {

    try {
        if (invalidState(msg)) {
            logger.log('Invalid state on message receive')
            return
        }
    
        if (msg.reply_to_message) {
            onReplyToMessage(msg)
            return
        }
        
        if (msg.text.charAt(0) != '/') {
            if (!lastSteamID) {
                return
            }
            steamChatBot.sendMessage(lastSteamID, msg.text)
        }
    } catch (error) {
        logger.log('Error on message', error.message)
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
const sendMessage = (message) => {
    if (!chatID) {
        logger.log("Trying to send Telegram message with null chatID")
        return
    }
    bot.sendMessage(chatID, message)
    lastSteamID = null
}

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
    
    lastSteamID = steamID
}

const encapsulateMessage = (message, senderID, nickname, messageType) => {
    return "`(" + messageType + ") " + nickname + " : " + senderID + "`\n" + message
}
//#endregion

const invalidState = (msg, checkOnlyUser = false, allowPublicUser = false) => {

    if (msg.chat.username != username && !allowPublicUser) {
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
    sendMessage,
    sendSteamMessageToTelegram,
    setSteamChatBot
}