# Backend Rules — PostPilot

## Express + TypeScript Standards

- All route handlers must be `async` and wrapped with error catching
- Use `next(error)` to pass errors to the global error handler — never `res.json({ error })` directly
- Every route file exports a `Router` instance, never an Express `app`
- Request bodies are validated with Zod before any DB call
- Response shape is always `{ data: T }` for success, `{ error: string, code: string }` for failure

### Route File Template
```typescript
// backend/src/routes/example.ts
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const CreateSchema = z.object({
  field: z.string().min(1).max(500),
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateSchema.parse(req.body);
    // ... implementation
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

## Supabase Rules

- **Backend always uses `SUPABASE_SERVICE_KEY`** — bypasses RLS (intentional — we apply our own checks)
- **Frontend always uses `VITE_SUPABASE_ANON_KEY`** — respects RLS
- Never expose service key to frontend
- All DB types come from `src/db/supabase.ts` — never write raw query strings without the type system
- Use `.select()` with explicit column lists — never `select('*')` in production code

### Supabase Query Pattern
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('id, content, status, scheduled_at, media_urls')
  .eq('user_id', userId)
  .order('scheduled_at', { ascending: true });

if (error) throw new Error(error.message);
```

---

## Authentication Middleware

- Every protected route uses `requireAuth` middleware
- `requireAuth` validates the Supabase JWT from `Authorization: Bearer <token>` header
- After validation, attach `req.user = { id, email }` to the request
- Never trust `user_id` from request body — always use `req.user.id`

---

## BullMQ / Redis Rules

- Queue name: `post-publishing`
- Job ID format: `post-{postId}` (allows deduplication)
- Always set `removeOnComplete: { count: 100 }` and `removeOnFail: { count: 50 }`
- Worker must update post status in DB after every attempt (success or failure)
- Failed jobs must log the error reason to `scheduled_jobs` table
- Never block the main Express thread — all queue operations are fire-and-forget

---

## API Call Rules (Meta + LinkedIn)

- All API calls have a 10-second timeout
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Log every API call: `[META] POST /v18.0/... → 200 OK (234ms)`
- On rate limit (HTTP 429): pause queue for that account for 1 hour
- Tokens must be validated before making API calls — check expiry from DB

---

## Error Handling

- HTTP status codes must be semantic:
  - `400` — validation error (Zod)
  - `401` — not authenticated
  - `403` — authenticated but not authorized (wrong user's resource)
  - `404` — resource not found
  - `422` — business logic error (e.g., free plan limit reached)
  - `429` — rate limit hit
  - `500` — unexpected server error
- Never return stack traces to the client in production
- Always log the full error server-side with `console.error`

---

## Free Plan Enforcement

Always check before creating a post:
```typescript
async function enforceFreeLimit(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, monthly_post_count')
    .eq('id', userId)
    .single();

  if (profile?.plan === 'free' && (profile?.monthly_post_count ?? 0) >= 10) {
    throw new AppError('Free plan limit reached (10 posts/month)', 422, 'FREE_LIMIT_REACHED');
  }
}
```

---

## Token Security

- Tokens stored in DB must be encrypted with AES-256 (use `crypto` built-in)
- Encryption key from `TOKEN_ENCRYPTION_KEY` env var (32 bytes, hex)
- Never log tokens — redact in all log statements
- Token refresh cron runs daily at 02:00 UTC (`node-cron`)
