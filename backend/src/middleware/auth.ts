/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-key-change-this-in-production';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

// Optional auth middleware - extracts user if token is provided but doesn't require it
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Find user
        const user = await UserModel.findById(decoded.userId).select(
          '-password'
        );
        if (user) {
          req.user = {
            id: user.id.toString(),
            email: user.email,
          };
          console.log(`🔐 Authenticated user: ${user.email}`);
        }
      } catch {
        console.log('🔓 Invalid or expired token, proceeding as anonymous');
        // Don't throw error - just proceed without user
      }
    }

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    next(); // Continue without authentication
  }
};

// Required auth middleware - requires valid token
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      // Find user
      const user = await UserModel.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        });
      }

      req.user = {
        id: user.id.toString(),
        email: user.email,
      };

      next();
    } catch {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in requireAuth middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
};
