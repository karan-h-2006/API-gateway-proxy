const crypto = require('crypto')

const generateApiKey = (size = 32 , encoding = 'hex') => {

    return crypto.randomBytes(size).toString(encoding);

}

module.exports = generateApiKey;