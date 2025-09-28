import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

// Detailed health check with database and Redis
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Check database connection
    try {
      await query('SELECT 1');
      health.services.database = 'connected';
    } catch (error) {
      health.services.database = 'disconnected';
      health.status = 'unhealthy';
    }

    // Check Redis connection
    try {
      const redis = getRedisClient();
      await redis.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

export default router;


