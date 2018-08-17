/*
 * Library for manipulate elasticsearch
 *
 */

// Dependencies
const http = require('http')
const https = require('https')
const helpers = require('./helpers')

// Container for the module
const lib = {}

// Init with config
lib.init = (config) => {
    lib._config = typeof(config) == 'object' && config !== {} ? config : require('./config')
    lib._moduleHttpToUse = lib._config.protocol == 'http' ? http : https
}

// Parse config for constructed elasticsearch url
lib._createRequestUrlFromConfig = () => {
    const { protocol, hostname, port } = lib._config
    return {
        protocol,
        hostname,
        port
    }
}

// Return the headers for the request
lib._getRequestHeaders = (payload) => {
    let headers = {}
    if (typeof(payload) == 'object' && payload !== {}) {
        headers['Content-Type'] = 'application/json'
        headers['Content-Length'] = Buffer.byteLength(JSON.stringify(payload))
    }
    if (lib._config.username && lib._config.password) {
        headers['Authorization'] = "Basic " + new Buffer(lib._config.username + ":" + lib._config.password).toString("base64")
    }

    return headers
}

// Add a document inside the given indexName
lib.addDocument = (indexName, payload, id = null) => {
    return new Promise((resolve, reject) => {
        id = id == null ? helpers.createRandomString(20) : id
        const stringPayload = JSON.stringify(payload)
        const requestDetails = {
            method: 'PUT',
            path: `/${indexName}/_doc/${id}`,
            headers: lib._getRequestHeaders(stringPayload),
            ...lib._createRequestUrlFromConfig()
        }

        let data = ''
        const req = lib._moduleHttpToUse.request(requestDetails)
        req.on('response', (res) => {
            res.on('data', (chunk) => {
                data += chunk.toString()
            })
            res.on('end', () => {
                resolve(JSON.parse(data))
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end(stringPayload)
    })
}

// Remove an index
lib.removeIndex = (indexName) => {
    return new Promise((resolve, reject) => {
        const requestDetails = {
            method: 'DELETE',
            path : '/' + indexName,
            headers: lib._getRequestHeaders(),
            ...lib._createRequestUrlFromConfig()
        }

        const req = lib._moduleHttpToUse.request(requestDetails)
        req.on('response', (res) => {
            res.on('end', () => {
                resolve(true)
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })
}
// Search advanced
lib.searchAdvanced = (payload) => {
    return new Promise((resolve, reject) => {
        const stringPayload = JSON.stringify(payload)
        const requestDetails = {
            method: 'POST',
            path: '/movies2/_search?pretty',
            headers: lib._getRequestHeaders(stringPayload),
            ...lib._createRequestUrlFromConfig()
        }

        let data = ''
        const req = lib._moduleHttpToUse.request(requestDetails)
        req.on('response', (res) => {
            res.on('data', (chunk) => {
                data += chunk.toString()
            })
            res.on('end', () => {
                resolve(JSON.parse(data))
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end(stringPayload)
    })
}

// Search a text
lib.search = (indexName, str) => {
    return new Promise((resolve, reject) => {
        const requestDetails = {
            method: 'GET',
            path : `/${indexName}/_search?q=${str}`,
            headers: lib._getRequestHeaders(),
            ...lib._createRequestUrlFromConfig()
        }

        let data = ''
        const req = lib._moduleHttpToUse.request(requestDetails)
        req.on('response', (res) => {
            res.on('data', (chunk) => {
                data += chunk.toString()
            })
            res.on('end', () => {
                resolve(JSON.parse(data))
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })

}

// Create an index
lib.createIndex = (indexName, settings, mappings) => {
    settings = typeof(settings) == 'object' && settings !== {} ? settings : false
    mappings = typeof(mappings) == 'object' ? mappings : {}

    return new Promise((resolve, reject) => {
        if (settings) {
            const payload = {
                settings,
                mappings
            }
            const stringPayload = JSON.stringify(payload)
            const requestDetails = {
                method: 'PUT',
                path: '/' + indexName,
                headers: lib._getRequestHeaders(stringPayload),
                ...lib._createRequestUrlFromConfig()
            }

            let data = ''
            const req = lib._moduleHttpToUse.request(requestDetails)
            req.on('response', (res) => {
                res.on('data', (chunk) => {
                    data += chunk.toString()
                })
                res.on('end', () => {
                    resolve(JSON.parse(data))
                })
            })
            req.on('error', (err) => {
                reject(err)
            })
            req.end(stringPayload)
        } else {
            reject(new Error('Parameter settings must be valid'))
        }
    })
}

// Test if index exist
lib.indexExist = (index) => {
    return new Promise((resolve, reject) => {
        const requestDetails = {
            method: 'GET',
            path : '/' + index,
            headers: lib._getRequestHeaders(),
            ...lib._createRequestUrlFromConfig()
        }
        let data = ''
        const req = lib._moduleHttpToUse.request(requestDetails)
        req.on('response', (res) => {
            res.on('data', (chunk) => {
                data += chunk.toString()
            })
            res.on('end', () => {
                const response = JSON.parse(data)
                if (!response.error) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })
}

// Export the module
module.exports = lib
