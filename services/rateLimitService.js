const env = require('../config/env');
const AppError = require('./appError');
const infrastructureService = require('./infrastructureService');

const memoryStore = new Map();

const getBucketMetadata = () => {
  const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const resetAt = new Date((bucket + 1) * windowMs);

  return {
    bucket,
    resetAt,
    windowMs
  };
};

const cleanupExpiredMemoryBuckets = () => {
  const now = Date.now();

  for (const [key, value] of memoryStore.entries()) {
    if (value.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
};

const applyMemoryRateLimit = (apiKeyId) => {
  cleanupExpiredMemoryBuckets();

  const { bucket, resetAt, windowMs } = getBucketMetadata();
  const storeKey = `rate_limit:${apiKeyId}:${bucket}`;
  const existingBucket = memoryStore.get(storeKey);
  const currentCount = (existingBucket?.count || 0) + 1;

  memoryStore.set(storeKey, {
    count: currentCount,
    expiresAt: Date.now() + windowMs
  });

  return {
    currentCount,
    remaining: Math.max(env.RATE_LIMIT_MAX_REQUESTS - currentCount, 0),
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    resetAt
  };
};

const applyRedisRateLimit = async (apiKeyId) => {
  const redis = infrastructureService.getRedisClient();
  const { bucket, resetAt } = getBucketMetadata();
  const storeKey = `rate_limit:${apiKeyId}:${bucket}`;
  const currentCount = await redis.incr(storeKey);

  if (currentCount === 1) {
    await redis.expire(storeKey, env.RATE_LIMIT_WINDOW_SECONDS + 1);
  }

  return {
    currentCount,
    remaining: Math.max(env.RATE_LIMIT_MAX_REQUESTS - currentCount, 0),
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    resetAt
  };
};

const consumeRequest = async (apiKeyId) => {
  const result = infrastructureService.isRedisAvailable()
    ? await applyRedisRateLimit(apiKeyId)
    : applyMemoryRateLimit(apiKeyId);

  if (result.currentCount > env.RATE_LIMIT_MAX_REQUESTS) {
    throw new AppError(429, 'Rate limit exceeded. Please try again later.', {
      limit: result.limit,
      remaining: 0,
      resetAt: result.resetAt.toISOString()
    });
  }

  return result;
};

module.exports = {
  consumeRequest
};
