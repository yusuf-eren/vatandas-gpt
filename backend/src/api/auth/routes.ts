import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../models/user.model';

const router = Router();

// JWT secret - in production, this should be from environment variables
const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Helper function to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email',
        timestamp: new Date().toISOString(),
      });
    }

    // Create new user
    const user = new UserModel({ email, password });
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString());

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      success: true,
      jwt: token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in user registration:', error);

    // Handle validation errors
    if (
      error instanceof Error &&
      'name' in error &&
      error.name === 'ValidationError'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during registration',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    console.log(`✅ User signed in: ${email}`);

    res.json({
      success: true,
      jwt: token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in user signin:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signin',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
