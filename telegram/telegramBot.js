const TelegramBot = require('node-telegram-bot-api')
const logger = require('../logger')
const jsonFiles = require('../tools/jsonFiles')
const timer = require('../tools/timer')
const commandForwarder = require('../commandForwarder')
const { text } = require('body-parser')
let steamChatBot = null

const username = process.env.TELEGRAM_USER
const bot = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY, {polling: true})

const startTime = new Date()

let lastSteamID = null

//#region commands
//#region onCommandSetup
let commandList = {}

const commandBase = (needsSteam, isPublic, callback, msg, power) => {
    if (invalidState(msg, !needsSteam, isPublic, power)) {
        return
    }
    
    let params = msg.text.split(" ")
    params.shift()
    
    if (params.length == 0) {
        params = null
    }
    
    callback(msg, params)
}

const onSteamCommand = (command, callback, desc, power = Infinity) => {
    onCommandBase(command, true, false, callback, desc, power)
}

const onPublicCommand = (command, callback, desc, power) => {
    onCommandBase(command, false, true, callback, desc, power)
}

const onCommand = (command, callback, desc, power) => {
    onCommandBase(command, false, false, callback, desc, power)
}

const onCommandBase = (command, needsSteam, isPublic, callback, desc, power) => {
    if (command.includes(' ')) {
        logger.log('Command \'' + command + '\' has illegal characters')
    } else if (commandList[command]) {
        logger.log('Command \'' + command + '\' already exists')
    }
    
    const match = new RegExp('^/' + command + '( |$)', 'i')
    const action = commandBase.bind(null, needsSteam, isPublic, callback, power)
    
    commandList[command.toLowerCase()] = {command: command, desc: desc, regex: match, callback: action, power: power}
}

const extractCommand = (text) => {
    return text.split(' ')[0].substring(1)
}
const extractParamString = (text) => {
    const index = text.indexOf(' ')
    if (index < 0) {
        return null
    }
    return text.substring(index)
}
//#endregion

//#region match
onCommand('autologin', (msg, params) => {
    
    if (!params) {
        return
    }
    
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
}, 'Sets the autologin setting on/off')

onCommand("autoreply", (msg, params) => {
    
    if (!params) {
        return
    }
    
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
}, 'Sets the Steam message autoreply setting on/off')

onCommand("informLogin", (msg, params) => {
    
    if (!params) {
        return
    }
    
    const param = checkConfirmString(params[0])

    if (param == 1) {
        settings.informLogin = true
        jsonFiles.saveSettings()
        sendBotMessage("Set 'informLogin' to true")
    } else if (param == 0) {
        settings.informLogin = false
        jsonFiles.saveSettings()
        sendBotMessage("Set 'inforLogin' to false")
    }
}, 'Sets the Steam message autoreply setting on/off')


onCommand("defaultSteamState", (msg, params) => {
    
    if (!params) {
        return
    }

    settings.defaultSteamState = params[0]
    jsonFiles.saveSettings()

    sendBotMessage("Set 'defaultSteamState' to " + params[0])
}, 'Sets the default Steam state for the bot (Online, Offline, Away etc.)')

onCommand("relayStringMatch", (msg, params) => {
    
    let param = null
    
    if (params) {
        param = params[0]
    }
    
    if (param == null || param.length == 0) {
        param = null
    }

    settings.relayStringMatch = param
    jsonFiles.saveSettings()

    sendBotMessage("Set 'relayStringMatch' to " + param)
}, 'Sets the prefix string for the command relay functionality. Leave blank to relay everything.')

const checkConfirmString = (s) => {
    s = s.toLowerCase()
    if (s == 'yes' || s == 'true' || s == '1' || s == 'y' || s == 'on') {
        return 1
    }

    if (s == 'no' || s == 'false' || s == '0' || s == 'n' || s == 'off') {
        return 0
    }

    return -1
}

onCommand('setGuestPower', (msg, params) => {

    try {
        const param = checkConfirmString(params[0])
    
        const val = Number(param)

        settings.guestPower = val
        jsonFiles.saveSettings()
        sendBotMessage("Set 'guestPower' to " + param)
    } catch(e) {
        logger.log('Error on guestPower set', e.message)
    }

}, 'Set the current guest power')

onCommand('help', (msg, params) => {
    let help
    
    if (params) {
        help = commandList[params[0]]
        cmd = help.command.charAt(0).toUpperCase() + help.command.slice(1)
        
        let desc
        if (help.desc) {
            desc = help.desc.charAt(0).toUpperCase() + help.desc.slice(1)
        }
        
        if (help) {
            help = '`/' + cmd + '`\n' + (desc ? desc : 'No description for command')
        } else {
            help = 'No command found'
        }
        
    } else {
        help = 'Available commands:'
        for (const [key, value] of Object.entries(commandList)) {
            cmd = key.charAt(0).toUpperCase() + key.slice(1)
            let desc
            
            if (value.desc) {
                desc = value.desc.charAt(0).toUpperCase() + value.desc.slice(1)
            }
            
            help += '\n\n`/' + cmd + (desc ? '`\n' + desc : '`')
        }
    }
    
    sendBotMessage(help)
}, 'Shows available commands and their descriptions')

onCommand('login', (msg, params) => {
    global.steamManager.autologin()
})

onCommand('status', (msg, params) => {
    
    const passed = (new Date().getTime() - startTime.getTime()) / 1000
    const hours = Math.floor(passed / 3600)
    const minutes = Math.floor(passed % 3600 / 60)
    const seconds = Math.floor(passed % 60)
    
    const status = 'Bot status:\nRunning time: ' + hours + ' hours ' + minutes + ' minutes ' + seconds + ' seconds'
    sendBotMessage(status)
})

onSteamCommand('code', (msg, params) => {
    
    sendMessage(steamManager.getCode())
}, 'Gets the steam auth code')

onSteamCommand('online', (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Online)
    sendBotMessage("Steam status: Online")
})

onSteamCommand('away', (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Away)
    sendBotMessage("Steam status: Away")
})

onSteamCommand('busy', (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Busy)
    sendBotMessage("Steam status: Busy")
})

onSteamCommand('invisible', (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Invisible)
    sendBotMessage("Steam status: Invisible")
})

onSteamCommand('offline', (msg, params) => {
    
    steamClient.setPersona(SteamUser.EPersonaState.Offline)
    sendBotMessage("Steam status: Offline")
})

onSteamCommand('setname', (msg, params) => {
    
    const paramString = extractParamString(msg.text)

    if (!paramString) {
        return
    }

    steamClient.setPersona(settings.defaultSteamState, paramString)
    sendBotMessage("Set Steam name to: " + paramString)
}, 'Sets the name of your Steam profile and sets your Steam state to the default state', 1)

onCommand('quit', (msg, params) => {
    
    logger.log('Stop bot')
    bot.stopPolling()

    sendBotMessage("Stopping the bot. Goodbye!", false)
    quitAction()
}, 'Stops the application')
const quitAction = async () => {
    await timer(5000)
    process.exit(0)
}

onCommand('test', (msg, params) => {
    
    sendMessage('Testing')
})
//#endregion



//#region general
bot.on('message', (msg) => {
    try {
        const command = extractCommand(msg.text)
        
        if (msg.text.match(/^\/\w+/)) {
            commandList[command.toLowerCase()].callback(msg)
            lastSteamID = null
            return
        }
        
        if (invalidState(msg)) {
            logger.log('Invalid state on message receive')
            return
        }
        
        if (settings.relayStringMatch != null && msg.text.startsWith(settings.relayStringMatch)) {
            lastSteamID = null
            commandForwarder.forwardCommand(msg.text, settings.relayStringMatch)
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
})

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
    const url = msg.entities[1].url
    const id = url.substring(10, url.length - 1)
    return id
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

    const toSend = steamID == null ? message : encapsulateMessage(message, steamID, nickname, "Steam")

    bot.sendMessage(settings.chatID, toSend, {parse_mode: "Markdown"}).then(sent => {
        if (steamID) {
            logger.log('Forwarded Steam message to Telegram', sent.text)
        }
    })
    
    lastSteamID = steamID
}

const encapsulateMessage = (message, senderID, nickname, messageType) => {
    return "`(`[" + messageType + "](id." + senderID + ")`) " + nickname + "`\n" + message
}
//#endregion

const invalidState = (msg, checkOnlyUser = false, allowPublicUser = false, requiredPower) => {

    if (msg.date * 1000 < startTime.getTime()) {
        logger.log('Not executing queued up command')
        return true
    }

    if (msg.chat.username != username && !allowPublicUser) {

        if (settings.guestPower <= requiredPower) {
            return false
        }

        logger.log("Received message from incorrect user", msg.chat)
        bot.sendMessage(msg.chat.id, "Sorry. This is a private bot. In order to use it yourself you have to configure it manually. Check github_link for more info.")
        sendBotMessage('Received message from incorrect user: ' + JSON.stringify(msg.chat) + "\nMessage: " + msg.text)
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

if (settings.relayStringMatch == null) {
    sendBotMessage('Warning: Relay string match not assigned')
}

module.exports = {
    sendMessage,
    sendSteamMessageToTelegram,
    setSteamChatBot,
    sendBotMessage
}