import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready to accept commands');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

// Cache utility functions
export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await redisClient.setEx(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  }
};

// Session management
export const session = {
  async set(userId: string, sessionData: any, ttl: number = 86400): Promise<boolean> {
    const key = `session:${userId}`;
    return await cache.set(key, JSON.stringify(sessionData), ttl);
  },

  async get(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    const data = await cache.get(key);
    return data ? JSON.parse(data) : null;
  },

  async delete(userId: string): Promise<boolean> {
    const key = `session:${userId}`;
    return await cache.del(key);
  }
};


