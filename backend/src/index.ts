// backend/src/index.ts
import 'dotenv/config';
import app from './app';
import { startWorker } from './workers/publishWorker';
import { ensureBucket } from './services/storage';

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

const PORT = process.env.PORT ?? 4000;

// ─── Start ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`[SERVER] PostPilot backend running on http://localhost:${PORT}`);
    await ensureBucket();
    startWorker();
  });
}

export default app;
