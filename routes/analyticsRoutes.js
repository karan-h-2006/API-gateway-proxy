const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.get('/requests', analyticsController.getRequestLogs);
router.get('/summary', analyticsController.getSummary);

module.exports = router;
