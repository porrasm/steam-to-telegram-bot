const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const dataFolder = 'localData'

let saving = false

const saveJson = async (filename, json, beautify) => {

    saving = true

    if (!fs.existsSync(dataFolder)) {

        await fs.mkdir(dataFolder)
    }

    const jsonString = beautify ? JSON.stringify(json, null, "\t") : JSON.stringify(json)

    fs.writeFile(`${dataFolder}/${filename}.json`, jsonString, function (error) {
        if (error) {
            logger.log('Error saving file', {dataFolder, filename})
        }
    })
}
const loadJson = async (filename) => {

    const path = `${dataFolder}/${filename}.json`

    if (!fs.existsSync(path)) {
        return null
    }

    const jsonString = await readFile(path)

    return JSON.parse(jsonString)
}

const saveSettings = async () => {
    return saveJson('settings', global.settings, true)
}
const loadSettings = async () => {
    return await loadJson('settings')
}

module.exports = { 
    saveJson, 
    saveSettings,
    loadJson,
    loadSettings
}