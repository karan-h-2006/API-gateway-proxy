const express = require('express');
const proxyController = require('../controllers/proxyController');
const authenticateApiKey = require('../middleware/apiKeyMiddleware');

const router = express.Router();

router.use(express.raw({ type: '*/*', limit: '1mb' }));
router.use(authenticateApiKey);
router.all('/', proxyController.proxyRequest);
router.all('/*proxyPath', proxyController.proxyRequest);

module.exports = router;
