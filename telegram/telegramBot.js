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

//#region commands
//#region onCommandSetup
let commandList = []

const commandBase = (needsSteam, isPublic, callback, msg) => {
    if (invalidState(msg, !needsSteam, isPublic)) {
        return
    }
    
    params = msg.text.split(" ")
    params.shift()
    
    callback(msg, params)
}

const onSteamCommand = (command, bParams, callback) => {
    onCommandBase(command, bParams, true, false, callback)
}

const onPublicCommand = (command, bParams, callback) => {
    onCommandBase(command, bParams, false, true, callback)
}

const onCommand = (command, bParams, callback) => {
    onCommandBase(command, bParams, false, false, callback)
}

const onCommandBase = (command, bParams, needsSteam, isPublic, callback) => {
    if (command.includes(' ')) {
        logger.log('Command \'' + command + '\' has illegal characters')
    }
    
    if (bParams) {
        match = new RegExp('^/' + command + ' (.+)$', 'i')
    } else {
        match = new RegExp('^/' + command + '$', 'i')
    }
    
    commandList.push({command: command, regex: match, callback: commandBase.bind(null, needsSteam, isPublic, callback)})
}

const getCommand = (command) => {
    res = commandList.find((value, index, array) => {
        return value.regex.exec(command)
    })
    
    if (res) {
        return res
    } else {
        return null
    }
}
//#endregion

//#region match
onCommand('autologin', true, (msg, params) => {
    
    try {
        const param = checkConfirmString(params[0])
    
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

onCommand("autoreply", true, (msg, params) => {
    
    const param = checkConfirmString(params[0])

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

onCommand("defaultSteamState", true, (msg, params) => {
    
    const param = params[0]

    settings.defaultSteamState = param
    jsonFiles.saveSettings()

    sendBotMessage("Set 'defaultSteamState' to " + param)
})

onCommand("relayStringMatch", true, (msg, params) => {
    
    let param = params[0]

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

onCommand('help', false, (msg, params) => {
    
    const helpString = `Available commands: \n\nto do`
    sendBotMessage(helpString)
})

onCommand('status', false, (msg, params) => {
    
    passed = (new Date().getTime() - startTime.getTime()) / 1000
    hours = Math.floor(passed / 3600)
    minutes = Math.floor(passed % 3600 / 60)
    seconds = Math.floor(passed % 60)
    
    status = 'Bot status:\nRunning time: ' + hours + ' hours ' + minutes + ' minutes ' + seconds + ' seconds'
    // const statusString = `Bot status:\nRunning time: ${Math.floor((new Date().getTime() - startTime.getTime()) / 3600000)} hours`
    sendBotMessage(status)
})

onSteamCommand('code', false, (msg, params) => {
    
    sendMessage(steamManager.getCode())
})

onSteamCommand('online', false, (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Online)
    sendBotMessage("Steam status: Online")
})

onSteamCommand('away', false, (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Away)
    sendBotMessage("Steam status: Away")
})

onSteamCommand('invisible', false, (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Invisible)
    sendBotMessage("Steam status: Invisible")
})

onSteamCommand('offline', false, (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Offline)
    sendBotMessage("Steam status: Offline")
})

onCommand('quit', false, (msg, params) => {
    
    logger.log('Stop bot')
    bot.stopPolling()

    sendBotMessage("Stopping the bot. Goodbye!", false)
    quitAction()
})
const quitAction = async () => {
    await timer(5000)
    process.exit(0)
}

onCommand('test', false, (msg, params) => {
    
    sendMessage('This is a test')
})

onCommand('test', true, (msg, params) => {
    
    sendMessage(JSON.stringify(params))
})
//#endregion



//#region general
bot.on('message', (msg) => {
    try {
        cmd = getCommand(msg.text)
        
        if (cmd) {
            cmd.callback(msg)
            return
        }
        
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
            sendBotMessage("Auto reply failed")
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

    if (msg.date * 1000 < startTime.getTime()) {
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