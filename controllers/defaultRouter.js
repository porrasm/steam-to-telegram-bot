const router = require('express').Router()
const path = require('path')
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
    response.redirect("/logs")
})

router.post('/logout', async (request, response) => {
    steamManager.logout()
    response.redirect("/logs")
})

router.post('/exit', async (request, response) => {
    response.redirect("/logs")
    steamManager.logout()
    telegramBot.sendMessage("Exiting application. Goodbye!")
    await timer(5000)
    process.exit(0)
})

module.exports = router