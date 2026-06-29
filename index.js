const express = require('express');
const env = require('./config/env');
const prisma = require('./db/prisma');
const authRoutes = require('./routes/authRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const proxyRoutes = require('./routes/proxyRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');

const app = express();

app.use('/api/v1/auth', express.json(), authRoutes);
app.use('/api/v1/api-keys', express.json(), apiKeyRoutes);
app.use('/proxy', proxyRoutes);
app.use('/health', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');

    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server because the database connection was not established.');
    console.error(error);
    process.exit(1);
  }
};

startServer();
