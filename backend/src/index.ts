import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import assignmentsRouter from './routes/assignments';
import { setupWebSocket } from './lib/websocket';
import { getRedis } from './lib/redis';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const frontendUrls = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);
const allowedOrigins = new Set(['http://localhost:3000', ...frontendUrls]);

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

// API Routes
app.use('/api/assignments', assignmentsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket
setupWebSocket(server);

// Start everything
async function bootstrap() {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('[Server] MongoDB connected');

    // Ping Redis
    const redis = getRedis();
    await redis.ping();
    console.log('[Server] Redis connected');

    server.listen(PORT, () => {
      const publicHost = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
      const wsHost = publicHost.replace(/^http/i, 'ws');
      console.log(`[Server] Running on ${publicHost}`);
      console.log(`[Server] WebSocket on ${wsHost}/ws`);
      console.log(`[Server] Health: ${publicHost}/health`);
      console.log(`[Server] Allowed CORS origins: ${Array.from(allowedOrigins).join(', ')}`);
    });
  } catch (err) {
    console.error('[Server] Startup error:', err);
    process.exit(1);
  }
}

bootstrap();
