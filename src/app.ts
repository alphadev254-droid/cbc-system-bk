// @ts-nocheck
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.middleware';
import router from './routes/index';
import logger from './config/logger';

const app: Application = express();
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

app.use((req, res, next) => {
  console.log('IP:', req.ip);
  console.log('X-Forwarded-For:', req.headers['x-forwarded-for']);
  next();
});

// Rate limiting
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(
  morgan('combined', {
    stream: { write: (msg: string) => logger.http(msg.trim()) },
  })
);

// Static uploads
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/v1', router);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global error handler
app.use(errorHandler);

export default app;
