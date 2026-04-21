// backend/src/index.ts
import 'dotenv/config';
import app from './app';
import { startWorker } from './workers/publishWorker';
import { ensureBucket } from './services/storage';
import { buildPlanPriceMap } from './services/stripe';

// Validate required env vars on startup
const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'META_APP_ID',
  'META_APP_SECRET',
  'REDIS_URL',
  'TOKEN_ENCRYPTION_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_UNLIMITED_PRICE_ID',
  'META_REDIRECT_URI',
  'LINKEDIN_REDIRECT_URI',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

const PORT = process.env.PORT ?? 4000;

// ─── Start ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  buildPlanPriceMap();
  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`[SERVER] PostPilot backend running on port ${PORT}`);
    await ensureBucket();
    startWorker();
  });
}

export default app;
