const Redis = require('ioredis');
const { Queue, Worker } = require('bullmq');
const env = require('../config/env');
const requestLogRepository = require('../db/repositories/requestLogRepository');

const state = {
  redis: {
    connected: false,
    mode: 'disconnected'
  },
  rateLimiter: {
    mode: 'memory'
  },
  analytics: {
    mode: 'direct'
  }
};

let redisClient = null;
let analyticsQueue = null;
let analyticsWorker = null;

const buildRedisOptions = () => ({
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true
});

const initialize = async () => {
  try {
    redisClient = new Redis(env.REDIS_URL, buildRedisOptions());
    redisClient.on('error', () => {
      // The startup path handles fallback; suppress duplicate noisy connection logs here.
    });
    await redisClient.connect();
    await redisClient.ping();

    analyticsQueue = new Queue(env.ANALYTICS_QUEUE_NAME, {
      connection: redisClient,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100
      }
    });

    analyticsWorker = new Worker(
      env.ANALYTICS_QUEUE_NAME,
      async (job) => {
        await requestLogRepository.createRequestLog(job.data);
      },
      {
        connection: redisClient.duplicate(),
        concurrency: env.ANALYTICS_WORKER_CONCURRENCY
      }
    );

    analyticsWorker.on('error', (error) => {
      console.error('Analytics worker error:', error.message);
    });

    state.redis = {
      connected: true,
      mode: 'redis'
    };
    state.rateLimiter = {
      mode: 'redis'
    };
    state.analytics = {
      mode: 'bullmq'
    };
  } catch (error) {
    console.warn('Redis is unavailable. Falling back to in-memory rate limiting and direct analytics logging.');
    analyticsQueue = null;
    analyticsWorker = null;
    if (redisClient) {
      redisClient.disconnect();
      redisClient = null;
    }

    state.redis = {
      connected: false,
      mode: 'unavailable',
      message: error.message
    };
    state.rateLimiter = {
      mode: 'memory'
    };
    state.analytics = {
      mode: 'direct'
    };
  }
};

const getRedisClient = () => redisClient;
const getAnalyticsQueue = () => analyticsQueue;
const getInfrastructureState = () => state;
const isRedisAvailable = () => state.redis.connected;

const shutdown = async () => {
  await Promise.allSettled([
    analyticsWorker?.close(),
    analyticsQueue?.close(),
    redisClient?.quit()
  ]);
};

module.exports = {
  initialize,
  getRedisClient,
  getAnalyticsQueue,
  getInfrastructureState,
  isRedisAvailable,
  shutdown
};
