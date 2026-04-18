# Security Rules — PostPilot

## Non-Negotiable Rules

These rules are ALWAYS enforced. No exceptions for "MVP speed."

---

## Authentication

- **Every protected endpoint has `requireAuth` middleware** — no exceptions
- JWT is validated on every request — never cached or trusted blindly
- Session tokens are never stored in localStorage — use Supabase's built-in session (httpOnly cookies via `createServerClient` on SSR, or memory for SPA)
- OAuth state parameter is always validated to prevent CSRF
- OAuth `code` parameters are single-use — never log them

---

## Authorization (Ownership Checks)

Always verify the authenticated user owns the resource they're accessing:
```typescript
// ✅ CORRECT
const { data: post } = await supabase
  .from('posts')
  .select('id')
  .eq('id', postId)
  .eq('user_id', req.user.id)  // ← ownership check
  .single();

if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');

// ❌ WRONG — never do this
const { data: post } = await supabase.from('posts').select('*').eq('id', postId);
```

---

## Token Storage

- Social access tokens are AES-256-GCM encrypted before storage
- Encryption/decryption happens only in `services/tokenManager.ts`
- Encryption key is `TOKEN_ENCRYPTION_KEY` env var — never hardcoded
- IV is randomly generated per encryption and stored with ciphertext (format: `iv:ciphertext`, both hex)
- Never log decrypted tokens — redact in all logs: `token: '[REDACTED]'`

### Encryption Implementation
```typescript
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
```

---

## Input Validation

- **All request bodies** are validated with Zod before touching the database
- **File uploads** are validated: MIME type whitelist (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`), max size 50MB
- **URLs** from external sources are never fetched directly without validation
- **SQL** — Supabase client uses parameterized queries — never string concatenation in queries

---

## CORS

Backend CORS configuration:
```typescript
cors({
  origin: process.env.FRONTEND_URL,  // never '*' in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

---

## Rate Limiting

Apply to all API endpoints:
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});
```

---

## Environment Variables

- All secrets are in `.env` files — never in source code
- `.env` files are in `.gitignore` — never committed
- Minimum required variables validated on server startup:
```typescript
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'META_APP_ID', 'META_APP_SECRET', 'REDIS_URL', 'TOKEN_ENCRYPTION_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}
```

---

## Media Upload Security

- Validate file type by MIME type AND file extension (both must match whitelist)
- Scan file size before upload — reject > 50MB immediately
- Generate random UUID filename — never use the original filename
- Store in Supabase Storage with path: `{userId}/{uuid}.{ext}`
- Never allow directory traversal in file paths
