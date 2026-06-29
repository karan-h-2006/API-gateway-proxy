const analyticsService = require('../services/analyticsService');
const rateLimitService = require('../services/rateLimitService');

const applyRateLimit = async (req, res, next) => {
  try {
    const rateLimit = await rateLimitService.consumeRequest(req.apiKey.id);

    res.setHeader('X-RateLimit-Limit', rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    next();
  } catch (error) {
    if (error.statusCode === 429) {
      res.setHeader('X-RateLimit-Limit', error.details.limit);
      res.setHeader('X-RateLimit-Remaining', error.details.remaining);
      res.setHeader('X-RateLimit-Reset', error.details.resetAt);

      void analyticsService.recordProxyRequest({
        developerId: req.developer.id,
        apiKeyId: req.apiKey.id,
        method: req.method,
        gatewayPath: req.originalUrl,
        upstreamPath: null,
        statusCode: 429,
        latencyMs: Date.now() - req.proxyRequestContext.startedAtMs,
        wasRateLimited: true,
        requestedAt: req.proxyRequestContext.requestedAt
      });
    }

    next(error);
  }
};

module.exports = applyRateLimit;
