import express = require('express');
import { Request, Response, NextFunction } from 'express';
import cors = require('cors');
import helmet from 'helmet';
import questionRoutes from './routes/questionRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { testConnection, closePool } from './config/database';


// Load environment variables


// Create Express app
const app: express.Application = express();
const PORT = process.env['PORT'] || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env['NODE_ENV'] === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    // Explicitly reference res to satisfy noUnusedParameters without altering behavior
    void res;
    next();
  });
}

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    res.json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api', questionRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  try {
    await closePool();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    //process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      //process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log('=================================');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    //process.exit(1);
  }
}

if (process.env['NODE_ENV'] !== 'test') {
  startServer();
}

export default app;