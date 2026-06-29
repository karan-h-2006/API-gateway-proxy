const crypto = require('crypto');

const generateApiKey = (size = 32, encoding = 'hex') => {
  return crypto.randomBytes(size).toString(encoding);
};

const hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

const getApiKeyPrefix = (apiKey) => {
  return apiKey.slice(0, 12);
};

module.exports = {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix
};
