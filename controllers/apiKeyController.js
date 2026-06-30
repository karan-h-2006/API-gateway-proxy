const { z } = require('zod');
const apiKeyService = require('../services/apiKeyService');

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(100)
});

const createApiKey = async (req, res) => {
  const payload = createApiKeySchema.parse(req.body);
  const apiKey = await apiKeyService.createApiKey({
    developerId: req.user.id,
    name: payload.name
  });

  res.status(201).json({ apiKey });
};

const listApiKeys = async (req, res) => {
  const apiKeys = await apiKeyService.listApiKeys(req.user.id);

  res.status(200).json({ apiKeys });
};

const revokeApiKey = async (req, res) => {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid API Key ID format' });
  }

  const result = await apiKeyService.revokeApiKey({
    id: req.params.id,
    developerId: req.user.id
  });

  res.status(200).json(result);
};

const regenerateApiKey = async (req, res) => {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid API Key ID format' });
  }

  const apiKey = await apiKeyService.regenerateApiKey({
    id: req.params.id,
    developerId: req.user.id
  });

  res.status(200).json({ apiKey });
};

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  regenerateApiKey
};
