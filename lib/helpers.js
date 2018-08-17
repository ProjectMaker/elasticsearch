/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto')
const querystring = require('querystring')
const https = require('https')
const path = require('path')
const fs = require('fs')
const config = require('./config')

const helpers = {}

// Create a SHA256 hash
helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    } else {
        return false
    }
}

// Parse a json string to an object
helpers.parseJsonToObject = (json) => {
    try {
        return JSON.parse(json)
    } catch (ex) {
        return {}
    }

}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
    if (strLength) {
        // Define all the possible characters
        const possibleCharacters = 'azertyuiopqsdfghjklmwxcvbn1234567890'

        // Start the finale string
        let str = ''
        for (i = 1; i <= strLength; i++) {
            // Get a random character from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.random() * possibleCharacters.length)
            // Appened this character to the final string
            str += randomCharacter
        }

        // Return the final string
        return str
    } else {
        return false
    }
}

// Send and SMS message via Twilio
helpers.sendTwilioSMS = (phone, msg, cb) => {
    // Validate de parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false
    if (phone && msg) {
        // Configure the request payload
        const payload = {
            From: config.twilio.fromPhone,
            To: '+33' + phone,
            Body: msg
        }

        // Stringify the payload
        const stringPayload = querystring.stringify(payload)

        // Configure the request details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
            auth: config.twilio.accountSid + ':' + config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }

        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode
            if (status == 200 || status == 201) {
                cb(false)
            } else {
                cb('Status code returned was ' + status)
            }
        })

        // Bind to the error event so it doesn't get thrown
        req.on('error', (err) => {
            cb(err)
        })

        // Add the payload
        req.write(stringPayload)

        // End the request
        req.end()
    } else {
        cb('Given parameters were missing or invalid')
    }
}

// Get a string content of a template
helpers.getTemplate = (templateName, data, cb) => {
    templateName = typeof(templateName) == 'string' && templateName.length ? templateName : false
    data = typeof(data) == 'object' && data !== null ? data : {}

    if (templateName) {
        const templatesDir = path.join(__dirname, '/../templates/')
        fs.readFile(`${templatesDir}${templateName}.html`, 'utf8', (err,str) => {
            if (!err && str.length > 0) {
                // Do interpolation on the string
                const finalString = helpers.interpolate(str, data)
                cb(false, finalString)
            } else {
                cb('Not template could be found')
            }
        })
    } else {
        cb('A valid template name was not specified')
    }
}

// Add the universal header and footer to a string,  and pass provided data object to the header and footer
helpers.addUniversalTemplates = (str, data, cb) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : false
    data = typeof(data) == 'object' && data !== null ? data : {}

    if (str && data) {
        // Get the header
        helpers.getTemplate('_header', data, (err, headerStr) => {
            if (!err && headerStr) {
                // Get the footer
                helpers.getTemplate('_footer', data, (err, footerStr) => {
                    if (!err && footerStr) {
                        cb(false, headerStr + str + footerStr)
                    } else {
                        cb('Could not find the footer template')
                    }
                })
            } else {
                cb('Could not find the header template')
            }
        })
    } else {
        cb('Specified field pass to addUniversaleTemplate does not correct')
    }
}

// Take a given string and a data object and find/replace all the keys within it
helpers.interpolate = (str, data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : false
    data = typeof(data) == 'object' && data !== null ? data : {}

    if (str && data) {
        // Add the templateGlobals do the data object, prepending their key name with "global"
        for (const keyName in config.templateGlobals) {
            data[`global.${keyName}`] = config.templateGlobals[keyName]
        }

        // For each key in the data object, insert its value into a string at corresponding
        for (const key in data) {
            if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
                str = str.replace(`{${key}}`, data[key])
            }
        }
        return str
    } else {
        return ''
    }
}

// Get the contents of a static (public) asset
helpers.getStaticAsset = (fileName, cb) => {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false
    if( fileName) {
        const publicDir = path.join(__dirname, '/../public/')
        fs.readFile(publicDir+fileName, (err, data) => {
            if (!err && data) {
                cb(false, data)
            } else {
                cb('Could not found the file')
            }
        })
    } else {
        cb('A valid file name was not specified')
    }
}

// Export the module
module.exports = helpers