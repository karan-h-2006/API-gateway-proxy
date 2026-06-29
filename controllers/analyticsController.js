const { z } = require('zod');
const analyticsService = require('../services/analyticsService');

const logsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

const getRequestLogs = async (req, res) => {
  const query = logsQuerySchema.parse(req.query);
  const requestLogs = await analyticsService.listRequestLogs(req.user.id, query.limit);

  res.status(200).json({ requestLogs });
};

const getSummary = async (req, res) => {
  const summary = await analyticsService.getAnalyticsSummary(req.user.id);

  res.status(200).json({ summary });
};

module.exports = {
  getRequestLogs,
  getSummary
};
