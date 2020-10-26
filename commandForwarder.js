const axios = require('axios')
const logger = require('./logger')

const url = process.env.MESSAGE_RELAY_URL

const forwardCommand = (command, startsWith) => {
    if (!url) {
        logger.log('No relay URL specified')
        return
    }

    logger.log('Relaying command to ' + url)

    axios.post(url, {command, startsWith}, {timeout: 2})
}

module.exports = {
    forwardCommand
}