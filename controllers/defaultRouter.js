const router = require('express').Router()
const path = require('path')
const steamManager = require('../steam/steamManager')
const telegramBot = require('../telegram/telegramBot')
const timer = require('../tools/timer')

router.get('/', async (request, response) => {
    response.sendFile(path.resolve("pages/index.html"))
})

router.post('/login', async (request, response) => {
    const loginDetails = {}

    let user = request.body.username
    const password = request.body.password
    const code = request.body.code

    steamManager.login(user, password, code)
    return response.status(200).send()
})

router.post('/logout', async (request, response) => {
    steamManager.logout()
    return response.status(200).send()
})

router.post('/exit', async (request, response) => {
    steamManager.logout()
    telegramBot.sendMessage("Exiting application. Goodbye!")
    await timer(5000)
    process.exit(0)
})

module.exports = router