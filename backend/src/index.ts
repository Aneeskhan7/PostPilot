// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import accountsRouter from './routes/accounts';
import mediaRouter from './routes/media';
import aiRouter from './routes/ai';
import analyticsRouter from './routes/analytics';
import { startWorker } from './workers/publishWorker';

// Validate required env vars on startup
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'META_APP_ID',
  'META_APP_SECRET',
  'REDIS_URL',
  'TOKEN_ENCRYPTION_KEY',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
}));

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authLimiter, authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);

// ─── Error handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[SERVER] PostPilot backend running on http://localhost:${PORT}`);
});

startWorker();

export default app;
