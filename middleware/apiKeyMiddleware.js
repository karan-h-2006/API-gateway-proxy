const env = require('../config/env');
const AppError = require('../services/appError');
const apiKeyService = require('../services/apiKeyService');

const authenticateApiKey = async (req, res, next) => {
  try {
    const headerName = env.API_KEY_HEADER_NAME.toLowerCase();
    const rawApiKey = req.headers[headerName];

    if (!rawApiKey || Array.isArray(rawApiKey)) {
      throw new AppError(401, `Missing API key in header "${env.API_KEY_HEADER_NAME}".`);
    }

    const apiKey = await apiKeyService.authenticateApiKey(rawApiKey);

    req.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.keyPrefix
    };
    req.developer = apiKey.developer;

    void apiKeyService.touchApiKeyUsage(apiKey.id);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateApiKey;
