const initializeProxyRequestContext = (req, res, next) => {
  req.proxyRequestContext = {
    startedAtMs: Date.now(),
    requestedAt: new Date()
  };

  next();
};

module.exports = initializeProxyRequestContext;
