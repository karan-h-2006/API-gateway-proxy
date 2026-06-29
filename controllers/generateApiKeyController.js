const generateApiKey = require('../services/generateApiKey')
const env = require('../config/env')

const generateApiKeyController = (req, res) => {

    try{
        const apiKey = generateApiKey(env.API_KEY_SIZE, env.API_KEY_ENCODING)
        res.json({ apiKey })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}

module.exports = generateApiKeyController