import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from './database';
import { logger } from '../utils/logger';
import { JWTPayload } from '../types';

interface AuthenticatedSocket extends Socket {
  user?: JWTPayload;
}

export const initializeSocket = (io: Server): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Verify user exists and is active
      const userResult = await query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.user_id]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        organization_id: decoded.organization_id
      };

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.user?.user_id} connected via socket`);

    // Join user to their personal room
    socket.join(`user:${socket.user?.user_id}`);

    // Join organization room if user belongs to one
    if (socket.user?.organization_id) {
      socket.join(`org:${socket.user.organization_id}`);
    }

    // Content collaboration events
    socket.on('content:join', (contentId: string) => {
      socket.join(`content:${contentId}`);
      logger.info(`User ${socket.user?.user_id} joined content ${contentId}`);
    });

    socket.on('content:leave', (contentId: string) => {
      socket.leave(`content:${contentId}`);
      logger.info(`User ${socket.user?.user_id} left content ${contentId}`);
    });

    socket.on('content:edit', (data: { contentId: string; content: string; cursorPosition: number }) => {
      // Broadcast to other users in the same content
      socket.to(`content:${data.contentId}`).emit('content:update', {
        contentId: data.contentId,
        content: data.content,
        cursorPosition: data.cursorPosition,
        userId: socket.user?.user_id,
        timestamp: new Date()
      });
    });

    socket.on('content:cursor', (data: { contentId: string; cursorPosition: number }) => {
      socket.to(`content:${data.contentId}`).emit('content:cursor:update', {
        contentId: data.contentId,
        cursorPosition: data.cursorPosition,
        userId: socket.user?.user_id,
        timestamp: new Date()
      });
    });

    // Comment events
    socket.on('comment:new', (data: { contentId: string; comment: any }) => {
      socket.to(`content:${data.contentId}`).emit('comment:added', {
        contentId: data.contentId,
        comment: data.comment,
        userId: socket.user?.user_id,
        timestamp: new Date()
      });
    });

    // Review events
    socket.on('review:start', (data: { contentId: string; reviewId: string }) => {
      socket.to(`content:${data.contentId}`).emit('review:started', {
        contentId: data.contentId,
        reviewId: data.reviewId,
        reviewerId: socket.user?.user_id,
        timestamp: new Date()
      });
    });

    socket.on('review:complete', (data: { contentId: string; reviewId: string; rating: number }) => {
      socket.to(`content:${data.contentId}`).emit('review:completed', {
        contentId: data.contentId,
        reviewId: data.reviewId,
        rating: data.rating,
        reviewerId: socket.user?.user_id,
        timestamp: new Date()
      });
    });

    // Notification events
    socket.on('notification:read', (notificationId: string) => {
      // Mark notification as read in database
      query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', 
        [notificationId, socket.user?.user_id]);
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      logger.info(`User ${socket.user?.user_id} disconnected: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user?.user_id}:`, error);
    });
  });

  logger.info('Socket.IO initialized successfully');
};

// Helper function to emit notifications
export const emitNotification = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

// Helper function to emit to organization
export const emitToOrganization = (io: Server, organizationId: string, event: string, data: any) => {
  io.to(`org:${organizationId}`).emit(event, data);
};

// Helper function to emit to content collaborators
export const emitToContent = (io: Server, contentId: string, event: string, data: any) => {
  io.to(`content:${contentId}`).emit(event, data);
};


