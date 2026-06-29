const express = require('express');
const proxyController = require('../controllers/proxyController');
const authenticateApiKey = require('../middleware/apiKeyMiddleware');
const applyRateLimit = require('../middleware/rateLimitMiddleware');
const initializeProxyRequestContext = require('../middleware/proxyRequestContextMiddleware');

const router = express.Router();

router.use(express.raw({ type: '*/*', limit: '1mb' }));
router.use(initializeProxyRequestContext);
router.use(authenticateApiKey);
router.use(applyRateLimit);
router.all('/', proxyController.proxyRequest);
router.all('/*proxyPath', proxyController.proxyRequest);

module.exports = router;
