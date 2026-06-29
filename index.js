const express = require('express');
const env = require('./config/env');
const prisma = require('./db/prisma');
const authRoutes = require('./routes/authRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const proxyRoutes = require('./routes/proxyRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');
const infrastructureService = require('./services/infrastructureService');

const app = express();

app.use('/api/v1/auth', express.json(), authRoutes);
app.use('/api/v1/api-keys', express.json(), apiKeyRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/proxy', proxyRoutes);
app.use('/health', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');
    await infrastructureService.initialize();
    console.log(`Rate limiter mode: ${infrastructureService.getInfrastructureState().rateLimiter.mode}`);
    console.log(`Analytics mode: ${infrastructureService.getInfrastructureState().analytics.mode}`);

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server because the database connection was not established.');
    console.error(error);
    process.exit(1);
  }
};

const shutdown = async () => {
  await Promise.allSettled([
    prisma.$disconnect(),
    infrastructureService.shutdown()
  ]);
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

startServer();
