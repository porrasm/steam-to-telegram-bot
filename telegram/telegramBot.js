const TelegramBot = require('node-telegram-bot-api');
const logger = require('../logger');
const jsonFiles = require('../tools/jsonFiles')
const timer = require('../tools/timer')
const commandForwarder = require('../commandForwarder')
let steamChatBot = null

const username = process.env.TELEGRAM_USER
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {polling: true})

const startTime = new Date()

let lastSteamID = null

//#region  commands
//#region match
const onCommand = (command, acceptParams, callback) => {
    if (acceptParams) {
        match = new RegExp("^\/" + command + "( |$)", "i")
    } else {
        match = new RegExp("^\/" + command + "$", "i")
    }
    bot.onText(match, callback)
}

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

bot.onText(/^\/defaultSteamState (.+)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const param = match[1]

    settings.defaultSteamState = param
    jsonFiles.saveSettings()

    sendBotMessage("Set 'defaultSteamState' to " + param)
})

bot.onText(/^\/relayStringMatch (.+)/, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    let param = match[1]

    if (param == null || param.length == 0) {
        param = null
    }

    settings.relayStringMatch = param
    jsonFiles.saveSettings()

    sendBotMessage("Set 'relayStringMatch' to " + param)
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

onCommand('help', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const helpString = `Available commands: \n\nto do`
    sendBotMessage(helpString)
})

onCommand('status', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    const statusString = `Bot status:\nRunning time: ${(new Date() - startTime) / 3600} hours`
    sendBotMessage(statusString)
})

onCommand('code', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }
    
    sendMessage(steamManager.getCode())
})

onCommand('online', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Online)
    // bot.sendMessage(msg.chat.id, "Set you online on Steam")
    sendBotMessage("Steam status: Online")
})

onCommand('away', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Away)
    // bot.sendMessage(msg.chat.id, "Set you online on Steam")
    sendBotMessage("Steam status: Away")
})

onCommand('invisible', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Invisible)
    // bot.sendMessage(msg.chat.id, "Set you online on Steam")
    sendBotMessage("Steam status: Invisible")
})

onCommand('offline', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    steamClient.setPersona(SteamUser.EPersonaState.Offline)
    // bot.sendMessage(msg.chat.id, "Set you offline on Steam")
    sendBotMessage("Steam status: Offline")
})

onCommand('quit', false, (msg, match) => {

    if (invalidState(msg, true)) {
        return
    }

    logger.log('Stop bot')
    
    
    bot.stopPolling()

    sendBotMessage("Stopping the bot. Goodbye!", false)
    quitAction()
})
const quitAction = async () => {
    await timer(5000)
    process.exit(0)
}

onCommand('test', false, (msg, match) => {
    sendMessage('This is a test')
})

onCommand('test2', false, (msg, match) => {
    sendMessage('This is test 2')
})
//#endregion

//#region general
bot.on('message', (msg) => {
    try {
        if (invalidState(msg)) {
            logger.log('Invalid state on message receive')
            return
        }
        
        if (settings.relayStringMatch == null || msg.text.startsWith(settings.relayStringMatch)) {
            lastSteamID = null
            commandForwarder.forwardCommand(msg.text, settings.relayStringMatch)
            return
        } else if (msg.text.startsWith('/')) {
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

    const passedMillis = new Date() - startTime
    if (passedMillis < 10000) {
        logger.log('Not executing queued up command')
        return true
    }

    if (msg.chat.username != username && !allowPublicUser) {
        logger.log("Received message from incorrect user", msg.chat)
        bot.sendMessage(msg.chat.id, "Sorry. This is a private bot. In order to use it yourself you have to configure it manually. Check github_link for more info.")
        sendBotMessage('Received message from incorrect user: ' + JSON.stringify(msg.chat))
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

sendBotMessage('Started Steam to Telegram Bot')

module.exports = {
    sendMessage,
    sendSteamMessageToTelegram,
    setSteamChatBot,
    sendBotMessage
}