// backend/src/app.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import accountsRouter from './routes/accounts';
import mediaRouter from './routes/media';
import aiRouter from './routes/ai';
import analyticsRouter from './routes/analytics';
import billingRouter from './routes/billing';
import adminRouter from './routes/admin';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());

// Response time header for observability
app.use((_req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    res.setHeader('x-response-time', `${Date.now() - start}ms`);
  });
  next();
});

// Raw body for Stripe webhook — must be before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', code: 'RATE_LIMITED' },
  }));
}

// Stricter limit for auth endpoints — browser OAuth routes redirect instead of returning JSON
const authLimiter = process.env.NODE_ENV === 'test' ?
  (req: any, res: any, next: any) => next() :
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: (req, res) => {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const isBrowserRoute = /^\/(meta|linkedin)/.test(req.path);
      if (isBrowserRoute) {
        res.redirect(`${frontendUrl}/settings?error=rate_limited`);
      } else {
        res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMITED' });
      }
    },
  });

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authLimiter, authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);

// ─── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

export default app;