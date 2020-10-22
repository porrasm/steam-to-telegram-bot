const logger = require('./logger')
global.logger = require('./logger')
require('dotenv').config()
const steam = require('./steam/steamManager')

if (process.argv.length >= 5) {
    steam.login(process.argv[2], process.argv[3], process.argv[4])
} else {
    logger.log("Not enough arguments. Exiting application")
    process.exit(0)
}

require('./telegram/telegramBot')


const main = () => {

    

}

logger.log("Starting application...")

main()