import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();

// Production CORS configuration supporting custom domain, multi-origin frontends, and credentialed requests
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If configured origins explicitly list origin or wildcard, or if custom domain/local, allow and reflect origin
    if (
      configuredOrigins.length === 0 ||
      configuredOrigins.includes('*') ||
      configuredOrigins.includes(origin) ||
      origin.includes('myvajra.cv') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('railway.app') ||
      origin.includes('onrender.com')
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Brand Sentinel Governance Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes (mount on /api and root fallback to support any frontend base URL configuration)
app.use('/api', apiRouter);
app.use(apiRouter);

// Serve Frontend SPA in Production if built
const clientDistPaths = [
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(process.cwd(), '..', 'client', 'dist'),
  path.resolve(process.cwd(), 'dist', 'client')
];

for (const clientDist of clientDistPaths) {
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    break;
  }
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
