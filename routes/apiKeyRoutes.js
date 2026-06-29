const express = require('express');
const apiKeyController = require('../controllers/apiKeyController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', apiKeyController.createApiKey);
router.get('/', apiKeyController.listApiKeys);
router.post('/:id/regenerate', apiKeyController.regenerateApiKey);
router.patch('/:id/revoke', apiKeyController.revokeApiKey);

module.exports = router;
