import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { connectDB } from './config/database.js';
import { validateEnv } from './config/validateEnv.js';
import { configureCloudinary } from './config/cloudinary.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import serviceRoutes from './routes/services.js';
import requestRoutes from './routes/requests.js';
import customRequestRoutes from './routes/customRequests.js';
import paymentRoutes from './routes/payments.js';
import messageRoutes from './routes/messages.js';
import fileRoutes from './routes/files.js';
import statsRoutes from './routes/stats.js';

dotenv.config();

// Validate environment variables before anything else
validateEnv();
configureCloudinary();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.disable('x-powered-by');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Trust proxy (required for Render/reverse proxies — rate limiter, req.ip)
app.set('trust proxy', 1);

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet — secure HTTP headers with strict CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// NoSQL Injection Protection — strips $ and . from req.body, req.query, req.params
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized NoSQL injection attempt in ${key} from IP: ${req.ip}`);
  }
}));

// HTTP Parameter Pollution Protection
app.use(hpp());

// Global Rate Limiter — 200 requests per 15 min per IP
app.use(globalRateLimiter);

// ─── CORS Configuration ─────────────────────────────────────────────────────

// Build allowed origins — handle both www and non-www
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  const url = new URL(process.env.FRONTEND_URL);
  if (url.hostname.startsWith('www.')) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace('www.', ''));
  } else {
    allowedOrigins.push(`${url.protocol}//www.${url.hostname}`);
  }
}
// Always allow localhost in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
}

logger.info(`CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────

// Reduced from 10mb to 1mb — only API JSON payloads need this, file uploads use multer
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));
app.use(csrfProtection(allowedOrigins));

// ─── Logging ─────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
    // Don't expose NODE_ENV in production — information disclosure
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────

// Avoid noisy 404 logs for browser favicon probes.
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/customRequests', customRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', statsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    app.listen(PORT, HOST, () => {
      logger.info(`Server running on ${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    await connectDB();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
