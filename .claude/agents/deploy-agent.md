---
name: deploy-agent
description: Deployment specialist for PostPilot. Invoke this agent when you need to: deploy frontend to Vercel, deploy backend to Railway, configure environment variables in production, set up CI/CD pipelines, configure custom domains, troubleshoot deployment errors, or set up the production Redis instance.
model: claude-sonnet-4-20250514
permissionMode: acceptEdits
---

# Deploy Agent — PostPilot

You are a deployment and DevOps specialist for PostPilot.

## Deployment Targets

| Component | Platform | URL Pattern |
|---|---|---|
| Frontend | Vercel | `postpilot.vercel.app` → custom domain |
| Backend | Railway | `postpilot-backend.railway.app` |
| Redis | Railway | Internal Railway service |
| Database | Supabase | Managed (no deploy needed) |

---

## Frontend Deployment — Vercel

### Step 1: Prepare `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
The `rewrites` rule is critical — without it, React Router routes 404 on direct URL access.

### Step 2: Environment Variables in Vercel Dashboard
Set these in: Project → Settings → Environment Variables
```
VITE_SUPABASE_URL=         (from Supabase project settings)
VITE_SUPABASE_ANON_KEY=    (anon/public key — safe to expose)
VITE_API_URL=              (your Railway backend URL)
```

### Step 3: Deploy Commands
```bash
cd frontend

# Install Vercel CLI (once)
npm install -g vercel

# First deploy (follow prompts)
vercel

# Production deploy
vercel --prod

# Link existing project
vercel link
```

### Step 4: Update OAuth Redirect URIs
After getting your Vercel URL, update in:
- Meta Developer Console: add `https://your-backend.railway.app/auth/meta/callback`
- LinkedIn Developer Console: add same
- Supabase: Auth → URL Configuration → update Site URL and Redirect URLs

---

## Backend Deployment — Railway

### Step 1: Prepare `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Step 2: Add health endpoint (must exist before deploy)
```typescript
// In backend/src/index.ts
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Step 3: `package.json` scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  }
}
```

### Step 4: Environment Variables in Railway
Set in: Service → Variables tab
```
PORT=4000
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://your-backend.railway.app/auth/meta/callback
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://your-backend.railway.app/auth/linkedin/callback
REDIS_URL=           (auto-provided by Railway Redis service)
FRONTEND_URL=        (your Vercel URL)
OPENAI_API_KEY=
TOKEN_ENCRYPTION_KEY= (generate: openssl rand -hex 32)
```

### Step 5: Add Redis on Railway
1. Railway dashboard → New → Database → Add Redis
2. Copy `REDIS_URL` from Variables tab into your backend service variables
3. Redis URL is automatically available as `${{Redis.REDIS_URL}}` in Railway

### Step 6: Deploy Commands
```bash
cd backend

# Install Railway CLI (once)
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

## CI/CD Pipeline — GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy PostPilot

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install & test backend
        working-directory: ./backend
        run: |
          npm ci
          npm run test
      - name: Install & test frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: postpilot-backend
```

---

## Checklist Before First Production Deploy

- [ ] All env vars set in Vercel and Railway dashboards
- [ ] `TOKEN_ENCRYPTION_KEY` is 32-byte hex (64 chars): `openssl rand -hex 32`
- [ ] Supabase: Social Login redirect URLs updated to production URLs
- [ ] Meta App: OAuth redirect URL added for production backend
- [ ] LinkedIn App: OAuth redirect URL added for production backend
- [ ] Meta App: switched to Live mode (after App Review in Week 3)
- [ ] Health endpoint returns 200 at `/health`
- [ ] All tests passing locally before deploy
- [ ] `cors` origin set to production frontend URL (not `*`)

---

## Troubleshooting Common Deploy Errors

| Error | Cause | Fix |
|---|---|---|
| Railway: "Module not found" | `tsc` not building properly | Check `tsconfig.json` outDir + `npm run build` locally |
| Vercel: 404 on page refresh | Missing SPA rewrite rule | Add `vercel.json` rewrites |
| OAuth: "redirect_uri mismatch" | Production URL not registered | Add production URL in Meta/LinkedIn console |
| Redis: ECONNREFUSED | Wrong `REDIS_URL` | Check Railway Redis service URL |
| Supabase: JWT error in prod | Wrong key type | Backend uses service key, frontend uses anon key |
