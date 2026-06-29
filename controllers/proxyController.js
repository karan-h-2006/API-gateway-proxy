const proxyService = require('../services/proxyService');

const proxyRequest = async (req, res) => {
  const upstreamResponse = await proxyService.forwardRequest(req);

  res.status(upstreamResponse.status);
  Object.entries(upstreamResponse.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.send(upstreamResponse.body);
};

module.exports = {
  proxyRequest
};
