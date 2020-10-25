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
    steamManager.getPersona(steamID).then((p) => {
        console.log("p: ", p)
        telegramBot.sendSteamMessageToTelegram(message, steamID, p.player_name)
    })
}

const sendMessage = (steamID, message) => {
    try {
        logger.log("Sending Steam message to recipient", {
            to: steamID,
            message
        })

        steamClient.chat.sendFriendMessage(steamID, message).then(res => {
            if (res.err) {
                telegramBot.sendMessage('Failed to respond to Steam message')
            }
        })
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