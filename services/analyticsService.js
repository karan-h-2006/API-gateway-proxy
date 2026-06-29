const { z } = require('zod');
const requestLogRepository = require('../db/repositories/requestLogRepository');
const infrastructureService = require('./infrastructureService');

const requestLogSchema = z.object({
  developerId: z.string().uuid(),
  apiKeyId: z.string().uuid(),
  method: z.string().min(1),
  gatewayPath: z.string().min(1),
  upstreamPath: z.string().nullable(),
  statusCode: z.number().int(),
  latencyMs: z.number().int().nonnegative(),
  wasRateLimited: z.boolean(),
  requestedAt: z.date()
});

const persistDirectly = (payload) => {
  setImmediate(async () => {
    try {
      await requestLogRepository.createRequestLog(payload);
    } catch (error) {
      console.error('Failed to persist analytics log:', error.message);
    }
  });
};

const recordProxyRequest = async (payload) => {
  const parsedPayload = requestLogSchema.parse(payload);
  const analyticsQueue = infrastructureService.getAnalyticsQueue();

  if (!analyticsQueue) {
    persistDirectly(parsedPayload);
    return;
  }

  try {
    await analyticsQueue.add('request-log', parsedPayload);
  } catch (error) {
    console.error('Failed to enqueue analytics job, falling back to direct persistence:', error.message);
    persistDirectly(parsedPayload);
  }
};

const listRequestLogs = async (developerId, limit) => {
  return requestLogRepository.findRequestLogsByDeveloperId(developerId, limit);
};

const getAnalyticsSummary = async (developerId) => {
  return requestLogRepository.getAnalyticsSummary(developerId);
};

module.exports = {
  recordProxyRequest,
  listRequestLogs,
  getAnalyticsSummary
};
