const TelegramBot = require('node-telegram-bot-api');
const logger = require('../logger');
const jsonFiles = require('../tools/jsonFiles')
let steamChatBot = null

const username = process.env.TELEGRAM_USER
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {polling: true})

const startTime = new Date().getUTCMilliseconds()

let lastSteamID = null

//#region  commands
bot.onText(/^\/autologin (.+)/, (msg, match) => {

    try {
        if (invalidState(msg, true)) {
            return
        }
    
        const param = checkConfirmString(match[1])
    
        if (param == 1) {
            settings.useAutoLogin = true
            jsonFiles.saveSettings()
            sendBotMessage("Set 'useAutoLogin' to true")
        } else if (param == 0) {
            settings.useAutoLogin = false
            jsonFiles.saveSettings()
            sendBotMessage("Set 'useAutoLogin' to false")
        }
    } catch(e) {
        logger.log('Error on autologin set', e.message)
    }
})

bot.onText(/^\/autoreply (.+)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const param = checkConfirmString(match[1])

    if (param == 1) {
        settings.useAutoReply = true
        jsonFiles.saveSettings()
        sendBotMessage("Set 'useAutoReply' to true")
    } else if (param == 0) {
        settings.useAutoReply = false
        jsonFiles.saveSettings()
        sendBotMessage("Set 'useAutoReply' to false")
    }
})

const checkConfirmString = (s) => {
    s = s.toLowerCase()
    if (s == 'yes' || s == 'true' || s == '1' || s == 'y') {
        return 1
    }

    if (s == 'no' || s == 'false' || s == '0' || s == 'n') {
        return 0
    }

    return -1
}
//#region settings

//#endregion

bot.onText(/^\/status( |$)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const statusString = `Bot status:\nRunning time: ${new Date().getHours() - startTime / 3600}`
    sendBotMessage(statusString)
})

bot.onText(/^\/code( |$)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }
    
    sendMessage(steamManager.getCode())
})

bot.onText(/^\/online( |$)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Online)
    // bot.sendMessage(msg.chat.id, "Set you online on Steam")
    sendBotMessage("Steam status: Online")
})

bot.onText(/^\/offline( |$)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Offline)
    // bot.sendMessage(msg.chat.id, "Set you offline on Steam")
    sendBotMessage("Steam status: Offline")
})


bot.onText(/^\/quit( |$)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    logger.log('Stop bot')
    
    sendBotMessage("This feature is broken :)")
    
    // bot.stopPolling()
    // bot.sendMessage(msg.chat.id, 'Stopping the bot. Goodbye!').then(r => {
        // process.exit(0)
    // })
    // sendMessage("Stopping the bot. Goodbye!", false, r => {
        // process.exit(0)
    // })
})


bot.onText(/^\/test( |$)/, (msg, match) => {
    sendMessage('This is a test')
})

bot.onText(/^\/test2( |$)/, (msg, match) => {
    url = msg.reply_to_message.entities[1].url
    sendMessage(url.substring(10, url.length - 1), false)
})

const onCommand = (command, acceptParams, callback) => {
    if (acceptParams) {
        match = new RegExp("^\/" + command + "( |$)")
    } else {
        match = new RegExp("^\/" + command + "$")
    }
    bot.onText(match, callback)
}

onCommand('test3', (msg, match) => {
    sendMessage('This is a test 3')
})


bot.on('message', (msg) => {

    try {
        if (invalidState(msg)) {
            logger.log('Invalid state on message receive')
            return
        }
        
        if (msg.text.charAt(0) == "/") {
            lastSteamID = null
            return
        }
    
        if (msg.reply_to_message) {
            onReplyToMessage(msg)
            lastSteamID = getSteamIDFromReply(msg.reply_to_message)
            return
        }
        
        if (lastSteamID && settings.useAutoReply) {
            steamChatBot.sendMessage(lastSteamID, msg.text)
        } else {
            sendBotMessage("No repicient for message")
        }
    } catch (error) {
        logger.log('Error on message', error.message)
    }
});


const onReplyToMessage = (msg) => {

    const steamID = getSteamIDFromReply(msg.reply_to_message)
    const text = msg.text

    if (!steamID) {
        return
    }

    logger.log("Replying to Steam message", {steamID, text})

    steamChatBot.sendMessage(steamID, text)
}
const getSteamIDFromReply = (msg) => {
    url = msg.entities[1].url
    id = url.substring(10, url.length - 1)
    return id
}
const getSteamIDFromReplyOld = (text) => {

    let split = text.split(": ")
    if (split.length < 1) {
        return null
    }

    split = split[1].split("\n")
    return split[0]
}

bot.onReplyToMessage(settings.chatID, null, (msg) => {
    logger.log('Reply to message', msg)
})
//#endregion

//#region steam integration
const sendMessage = (message, markdown = true, fThen = null) => {
    if (!settings.chatID) {
        logger.log("Trying to send Telegram message with null chatID")
        return
    }
    
    if (markdown) {
        if (fThen) {
            bot.sendMessage(settings.chatID, message, {parse_mode: "Markdown"}).then(fThen)
        } else {
            bot.sendMessage(settings.chatID, message, {parse_mode: "Markdown"})
        }
    } else {
        if (fThen) {
            bot.sendMessage(settings.chatID, message).then(fThen)
        } else {
            bot.sendMessage(settings.chatID, message)
        }
    }
    
    lastSteamID = null
}

const sendBotMessage = (message, fThen = null) => {
    sendMessage("`" + message + "`", true, fThen)
}

const sendSteamMessageToTelegram = (message, steamID, nickname) => {
    if (!settings.chatID) {
        logger.log("Received message but chatID is null", message)
        return
    }

    const toSend = steamID == null ? message : encapsulateMessage2(message, steamID, nickname, "Steam")

    bot.sendMessage(settings.chatID, toSend, {parse_mode: "Markdown"}).then(sent => {
        if (steamID) {
            logger.log('Forwarded Steam message to Telegram', sent.text)
        }
    })
    
    lastSteamID = steamID
}

const encapsulateMessage = (message, senderID, nickname, messageType) => {
    return "`(" + messageType + ") " + nickname + " : " + senderID + "`\n" + message
}
const encapsulateMessage2 = (message, senderID, nickname, messageType) => {
    return "`(`[" + messageType + "](id." + senderID + ")`) " + nickname + "`\n" + message
}
//#endregion

const invalidState = (msg, checkOnlyUser = false, allowPublicUser = false) => {

    if (msg.chat.username != username && !allowPublicUser) {
        logger.log("Received message from incorrect user", msg.chat)
        sendBotMessage("Sorry. This is a private bot. In order to use it yourself you have to configure it manually. Check github_link for more info.")
        return true
    } else {
        // proper init command???
        
        if (settings.chatID != msg.chat.id) {
            settings.chatID = msg.chat.id
            sendBotMessage("Welcome! Initialized bot with current chat id: " + settings.chatID)
            jsonFiles.saveSettings()
        }
    }

    if (checkOnlyUser) {
        return false
    }

    if (steamClient == null) {
        sendBotMessage("Sorry. You are currently not logged in to Steam.")
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
    setSteamChatBot,
    sendBotMessage
}