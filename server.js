const http = require('http')
const cors = require('cors')
const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser')

const defaultRouter = require('./controllers/defaultRouter')

let server = null

const createServer = () => {

    logger.log('Starting server')

    app.use(cors())
    //app.use(express.static('build'))
    app.use(morgan('tiny'))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use('/', defaultRouter)

    server = http.createServer(app)

    const port = process.env.SERVER_PORT

    if (port == null) {
        throw "No server port assigned."
    }

    server.listen(port, () => {
        logger.log(`Server running on port ${port}`)
    })
}

module.exports = {
    app,
    server,
    createServer
}