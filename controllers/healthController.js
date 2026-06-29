const prisma = require('../db/prisma');
const infrastructureService = require('../services/infrastructureService');

const getHealth = async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  const infrastructure = infrastructureService.getInfrastructureState();

  res.status(200).json({
    status: 'ok',
    database: 'connected',
    redis: infrastructure.redis,
    rateLimiter: infrastructure.rateLimiter,
    analytics: infrastructure.analytics
  });
};

module.exports = {
  getHealth
};
