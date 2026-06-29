const prisma = require('../prisma');

const apiKeyMetadataSelect = {
  id: true,
  developerId: true,
  name: true,
  keyPrefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true
};

const createApiKey = (data) => {
  return prisma.apiKey.create({
    data,
    select: apiKeyMetadataSelect
  });
};

const findApiKeysByDeveloperId = (developerId) => {
  return prisma.apiKey.findMany({
    where: { developerId },
    orderBy: { createdAt: 'desc' },
    select: apiKeyMetadataSelect
  });
};

const findApiKeyByIdForDeveloper = (id, developerId) => {
  return prisma.apiKey.findFirst({
    where: { id, developerId },
    select: {
      ...apiKeyMetadataSelect,
      keyHash: true
    }
  });
};

const findActiveApiKeyByHash = (keyHash) => {
  return prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
      developer: {
        isActive: true
      }
    },
    select: {
      ...apiKeyMetadataSelect,
      developer: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      }
    }
  });
};

const revokeApiKey = (id, developerId) => {
  return prisma.apiKey.updateMany({
    where: {
      id,
      developerId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
};

const updateApiKeyUsage = (id, lastUsedAt) => {
  return prisma.apiKey.update({
    where: { id },
    data: { lastUsedAt }
  });
};

const regenerateApiKey = (id, developerId, nextHash, nextPrefix) => {
  return prisma.apiKey.update({
    where: { id },
    data: {
      developerId,
      keyHash: nextHash,
      keyPrefix: nextPrefix,
      revokedAt: null,
      lastUsedAt: null
    },
    select: apiKeyMetadataSelect
  });
};

module.exports = {
  createApiKey,
  findApiKeysByDeveloperId,
  findApiKeyByIdForDeveloper,
  findActiveApiKeyByHash,
  revokeApiKey,
  updateApiKeyUsage,
  regenerateApiKey,
  apiKeyMetadataSelect
};
