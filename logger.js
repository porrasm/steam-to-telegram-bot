const filename = 'log'

const logFunction = (text, data, ...args) => {
    logHelper(false, text, data, args)
}

const logHelper = (debugOnly, text, data, ...args) => {
    const date = new Date()

    const timestamp = date.toUTCString()
    const time_millis = date.getTime()

    let stack = ""
    const trace = new Error().stack
    if (trace) {
        stack = trace.split("\n")[3]
    }

    let dataToAppend = {
        message: text,
        data: {},
        timestamp: timestamp,
        time_millis,
        stack
    }

    if (data) {
        dataToAppend.data = data
    }
    if (args) {
        dataToAppend.args = args
    }

    console.log('\n', dataToAppend)
}

module.exports = { log: logFunction }