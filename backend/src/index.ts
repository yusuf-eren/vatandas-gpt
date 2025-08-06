import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

import chatRoutes from './api/chat/routes';
import authRoutes from './api/auth/routes';

import db from './db';
// import './scraper/emlakjet/cron';
// import { propertyAgent } from './agents/home-agent/agent';

const app = express();

// Middleware
app.use(
  cors({
    // Bu şekilde yaptık çünkü bu bi hackathon demosu.
    // Domain'imiz olsaydı ilgili yerlere izin vermemiz gerekirdi. Bu kodu okuyanlara not :)
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error(err.stack);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

async function main() {
  await db();
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Vatandaş GPT Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(
      `🌊 Streaming endpoint: http://localhost:${PORT}/api/chat/stream`
    );
  });
}

main();
