const env = require('../config/env');
const apiKeyRepository = require('../db/repositories/apiKeyRepository');
const AppError = require('./appError');
const { generateApiKey, hashApiKey, getApiKeyPrefix } = require('./generateApiKey');

const createRawApiKey = () => {
  return `agp_${generateApiKey(env.API_KEY_SIZE, env.API_KEY_ENCODING)}`;
};

const createApiKey = async ({ developerId, name }) => {
  const rawApiKey = createRawApiKey();
  const keyHash = hashApiKey(rawApiKey);
  const keyPrefix = getApiKeyPrefix(rawApiKey);

  const apiKey = await apiKeyRepository.createApiKey({
    developerId,
    name,
    keyHash,
    keyPrefix
  });

  return {
    ...apiKey,
    apiKey: rawApiKey,
    prefix: apiKey.keyPrefix
  };
};

const listApiKeys = async (developerId) => {
  const apiKeys = await apiKeyRepository.findApiKeysByDeveloperId(developerId);

  return apiKeys.map((apiKey) => ({
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.keyPrefix,
    lastUsedAt: apiKey.lastUsedAt,
    revokedAt: apiKey.revokedAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt
  }));
};

const revokeApiKey = async ({ id, developerId }) => {
  const existingApiKey = await apiKeyRepository.findApiKeyByIdForDeveloper(id, developerId);

  if (!existingApiKey) {
    throw new AppError(404, 'API key not found.');
  }

  if (existingApiKey.revokedAt) {
    return {
      id: existingApiKey.id,
      revokedAt: existingApiKey.revokedAt,
      alreadyRevoked: true
    };
  }

  await apiKeyRepository.revokeApiKey(id, developerId);

  return {
    id,
    revokedAt: new Date(),
    alreadyRevoked: false
  };
};

const regenerateApiKey = async ({ id, developerId }) => {
  const existingApiKey = await apiKeyRepository.findApiKeyByIdForDeveloper(id, developerId);

  if (!existingApiKey) {
    throw new AppError(404, 'API key not found.');
  }

  const rawApiKey = createRawApiKey();
  const keyHash = hashApiKey(rawApiKey);
  const keyPrefix = getApiKeyPrefix(rawApiKey);

  const updatedApiKey = await apiKeyRepository.regenerateApiKey(id, developerId, keyHash, keyPrefix);

  return {
    id: updatedApiKey.id,
    name: updatedApiKey.name,
    prefix: updatedApiKey.keyPrefix,
    apiKey: rawApiKey,
    createdAt: updatedApiKey.createdAt,
    updatedAt: updatedApiKey.updatedAt
  };
};

const authenticateApiKey = async (rawApiKey) => {
  const keyHash = hashApiKey(rawApiKey);
  const apiKey = await apiKeyRepository.findActiveApiKeyByHash(keyHash);

  if (!apiKey) {
    throw new AppError(401, 'Invalid API key.');
  }

  return apiKey;
};

const touchApiKeyUsage = async (id) => {
  try {
    await apiKeyRepository.updateApiKeyUsage(id, new Date());
  } catch (error) {
    console.error(`Failed to update lastUsedAt for API key ${id}`, error);
  }
};

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  regenerateApiKey,
  authenticateApiKey,
  touchApiKeyUsage
};
