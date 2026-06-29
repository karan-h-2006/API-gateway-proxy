const prisma = require('../db/prisma');

const getHealth = async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  res.status(200).json({
    status: 'ok',
    database: 'connected'
  });
};

module.exports = {
  getHealth
};
