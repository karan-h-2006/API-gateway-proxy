const prisma = require('../prisma');

const requestLogSelect = {
  id: true,
  developerId: true,
  apiKeyId: true,
  method: true,
  gatewayPath: true,
  upstreamPath: true,
  statusCode: true,
  latencyMs: true,
  wasRateLimited: true,
  requestedAt: true,
  apiKey: {
    select: {
      id: true,
      name: true,
      keyPrefix: true
    }
  }
};

const createRequestLog = (data) => {
  return prisma.requestLog.create({
    data: {
      ...data,
      requestedAt: data.requestedAt instanceof Date
        ? data.requestedAt
        : new Date(data.requestedAt)
    }
  });
};

const findRequestLogsByDeveloperId = (developerId, limit = 25) => {
  return prisma.requestLog.findMany({
    where: { developerId },
    orderBy: { requestedAt: 'desc' },
    take: limit,
    select: requestLogSelect
  });
};

const getAnalyticsSummary = async (developerId) => {
  const now = Date.now();
  const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

  const [totalRequests, rateLimitedRequests, successfulProxyRequests, failedProxyRequests, recentRequests, latencyAggregate] =
    await Promise.all([
      prisma.requestLog.count({ where: { developerId } }),
      prisma.requestLog.count({ where: { developerId, wasRateLimited: true } }),
      prisma.requestLog.count({
        where: {
          developerId,
          wasRateLimited: false,
          statusCode: { gte: 200, lt: 400 }
        }
      }),
      prisma.requestLog.count({
        where: {
          developerId,
          wasRateLimited: false,
          statusCode: { gte: 400 }
        }
      }),
      prisma.requestLog.count({
        where: {
          developerId,
          requestedAt: { gte: last24Hours }
        }
      }),
      prisma.requestLog.aggregate({
        where: {
          developerId,
          wasRateLimited: false
        },
        _avg: {
          latencyMs: true
        }
      })
    ]);

  return {
    totalRequests,
    recentRequests,
    rateLimitedRequests,
    successfulProxyRequests,
    failedProxyRequests,
    averageLatencyMs: latencyAggregate._avg.latencyMs
      ? Math.round(latencyAggregate._avg.latencyMs)
      : 0
  };
};

module.exports = {
  createRequestLog,
  findRequestLogsByDeveloperId,
  getAnalyticsSummary
};
