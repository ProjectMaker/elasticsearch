/*
 * Library for manipulate elasticsearch
 *
 */

// Dependencies
const http = require('http')
const helpers = require('./helpers')
const config = require('./config')

// Container for the module
const lib = {}

// Add a document inside the given indexName
lib.addDocument = (indexName, payload, id = null) => {
    return new Promise((resolve, reject) => {
        id = id == null ? helpers.createRandomString(20) : id
        const stringPayload = JSON.stringify(payload)
        const requestDetails = Object.assign({
            method: 'PUT',
            path: `/${indexName}/_doc/${id}`,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }, {...config})

        let data = ''
        const req = http.request(requestDetails)
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
        const requestDetails = Object.assign({
            method: 'DELETE',
            path : '/' + indexName
        }, {...config})

        const req = http.request(requestDetails)
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
        const requestDetails = Object.assign({
            method: 'POST',
            path: '/movies2/_search?pretty',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }, {...config})

        let data = ''
        const req = http.request(requestDetails)
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
        const requestDetails = Object.assign({
            method: 'GET',
            path : `/${indexName}/_search?q=${str}`
        }, {...config})

        let data = ''
        const req = http.request(requestDetails)
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
            const requestDetails = Object.assign({
                method: 'PUT',
                path: '/' + indexName,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(stringPayload)
                }
            }, {...config})

            let data = ''
            const req = http.request(requestDetails)
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
        const requestDetails = Object.assign({
            method: 'GET',
            path : '/' + index
        }, {...config})

        let data = ''
        const req = http.request(requestDetails)
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
