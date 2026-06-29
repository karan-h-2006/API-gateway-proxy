const proxyService = require('../services/proxyService');
const analyticsService = require('../services/analyticsService');

const proxyRequest = async (req, res) => {
  try {
    const upstreamResponse = await proxyService.forwardRequest(req);

    res.status(upstreamResponse.status);
    Object.entries(upstreamResponse.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.send(upstreamResponse.body);

    void analyticsService.recordProxyRequest({
      developerId: req.developer.id,
      apiKeyId: req.apiKey.id,
      method: req.method,
      gatewayPath: req.originalUrl,
      upstreamPath: proxyService.buildUpstreamPath(req),
      statusCode: upstreamResponse.status,
      latencyMs: Date.now() - req.proxyRequestContext.startedAtMs,
      wasRateLimited: false,
      requestedAt: req.proxyRequestContext.requestedAt
    });
  } catch (error) {
    if (req.developer?.id && req.apiKey?.id) {
      void analyticsService.recordProxyRequest({
        developerId: req.developer.id,
        apiKeyId: req.apiKey.id,
        method: req.method,
        gatewayPath: req.originalUrl,
        upstreamPath: proxyService.buildUpstreamPath(req),
        statusCode: error.statusCode || 500,
        latencyMs: Date.now() - req.proxyRequestContext.startedAtMs,
        wasRateLimited: false,
        requestedAt: req.proxyRequestContext.requestedAt
      });
    }

    throw error;
  }
};

module.exports = {
  proxyRequest
};
