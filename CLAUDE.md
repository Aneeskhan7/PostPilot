# PostPilot — Claude Master Project File

> You are a senior full-stack engineer on the PostPilot team.
> PostPilot is a social media scheduler for Instagram, Facebook, and LinkedIn.
> Target users: freelancers, small businesses, solo creators.

---

## 🔴 CRITICAL RULES (read before every response)

1. **Never write pseudocode** — every file must be runnable
2. **Never skip imports** — all files include 100% of their imports
3. **Strict TypeScript** — zero `any` types, ever
4. **Show file path as line 1 comment** in every code block
5. **One file at a time** — complete it fully before moving on
6. **After every file** — tell the user the exact terminal command to run
7. **Never exceed 500 lines per file** — split into modules if needed
8. **Test before declaring done** — always include the test command

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Router v6 |
| State | Zustand + TanStack Query v5 |
| Backend | Node.js + Express + TypeScript |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (public bucket: `post-media`) |
| Job Queue | BullMQ + Redis (Railway free tier) |
| Social APIs | Meta Graph API + LinkedIn API |
| AI | OpenAI GPT-4o (optional captions) |
| Hosting | Vercel (frontend) + Railway (backend + Redis) |

---

## 📁 Project Structure

```
postpilot/
├── .claude/
│   ├── CLAUDE.md           ← this file (committed)
│   ├── agents/             ← subagent definitions
│   ├── skills/             ← slash commands
│   └── rules/              ← scoped rule files
├── backend/
│   └── src/
│       ├── index.ts
│       ├── db/
│       │   ├── supabase.ts
│       │   └── schema.sql
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── posts.ts
│       │   ├── accounts.ts
│       │   ├── media.ts
│       │   ├── ai.ts
│       │   └── analytics.ts
│       ├── services/
│       │   ├── meta.ts
│       │   ├── linkedin.ts
│       │   ├── scheduler.ts
│       │   ├── storage.ts
│       │   └── tokenManager.ts
│       └── workers/
│           └── publishWorker.ts
└── frontend/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Composer.tsx
        │   ├── Calendar.tsx
        │   ├── History.tsx
        │   └── Settings.tsx
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── PlatformPreview.tsx
        │   ├── MediaUploader.tsx
        │   ├── PostCard.tsx
        │   └── AccountBadge.tsx
        ├── hooks/
        │   ├── usePosts.ts
        │   ├── useAccounts.ts
        │   └── useAuth.ts
        ├── lib/
        │   ├── supabase.ts
        │   └── api/
        │       ├── posts.ts
        │       ├── accounts.ts
        │       ├── media.ts
        │       └── ai.ts
        ├── store/
        │   └── authStore.ts
        └── types/
            └── index.ts
```

---

## 🗓️ Build Order (follow exactly)

### Week 1 — Foundation
`schema.sql` → `db/supabase.ts` → `middleware/auth.ts` → `middleware/errorHandler.ts` → `services/meta.ts` → `services/linkedin.ts` → `routes/auth.ts` → `services/scheduler.ts` → `workers/publishWorker.ts`

### Week 2 — Backend + Auth
`routes/posts.ts` → `routes/accounts.ts` → `routes/media.ts` → `services/storage.ts` → `services/tokenManager.ts` → `backend/src/index.ts` → `frontend/lib/supabase.ts` → `store/authStore.ts` → `pages/Login.tsx`

### Week 3 — Frontend
`hooks/useAuth.ts` → `hooks/usePosts.ts` → `hooks/useAccounts.ts` → `components/Sidebar.tsx` → `components/AccountBadge.tsx` → `components/PostCard.tsx` → `pages/Dashboard.tsx` → `components/MediaUploader.tsx` → `components/PlatformPreview.tsx` → `pages/Composer.tsx` → `pages/Calendar.tsx` → `pages/History.tsx` → `pages/Settings.tsx`

### Week 4 — Polish + Deploy
`routes/ai.ts` → `routes/analytics.ts` → `pages/Composer.tsx` (AI section) → PWA config → Vercel deploy → Railway deploy

---

## 🔐 Environment Variables

### backend/.env
```
PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:4000/auth/meta/callback
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://localhost:4000/auth/linkedin/callback
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=
```

### frontend/.env
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:4000
```

---

## 🗄️ Database: 5 Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users — plan, monthly post count |
| `social_accounts` | Connected IG/FB/LinkedIn with encrypted tokens |
| `posts` | Content, platforms, status, scheduled_at |
| `post_analytics` | Likes/comments/reach per platform |
| `scheduled_jobs` | BullMQ job tracking per post |

**All tables use Row Level Security (RLS). Never bypass with anon key in backend.**

---

## 📋 Platform Rules

### Instagram
- Business/Creator accounts only (not personal)
- 2-step publish: create container → publish container
- Images must be on PUBLIC URL (Supabase Storage public bucket)
- Rate limit: 200 req/hour, 25 posts/24h per account
- Uses Facebook Page access token

### Facebook
- Posts to Pages only (not personal profiles)
- Same OAuth flow as Instagram (Meta Graph API)
- Page token never expires if from long-lived user token

### LinkedIn
- Personal profile: FREE, no approval needed
- Scope: `w_member_social`
- Tokens expire in 60 days — re-auth required (no refresh token)
- Images must be uploaded to LinkedIn first → reference by asset URN

---

## 🔄 Key Flows

### Scheduling Flow
1. User creates post with `scheduled_at`
2. Backend saves post: `status='scheduled'`
3. Backend creates BullMQ job: `delay = scheduledAt - now()`
4. Worker fetches post + accounts from DB at publish time
5. Worker calls Meta/LinkedIn API per platform
6. Worker updates status to `'published'` or `'failed'`
7. Frontend subscribes via Supabase Realtime

### Media Upload Flow
1. User drags image into Composer
2. Frontend → `POST /api/media/upload`
3. Backend saves to Supabase Storage bucket `post-media`
4. Backend returns public URL
5. URL stored in `posts.media_urls[]`
6. Same URL passed to Instagram/Facebook API

### Token Management
- Meta: exchange short → long-lived 60-day token immediately after OAuth
- Daily cron: refresh Meta tokens expiring within 10 days
- LinkedIn: 60-day expiry, re-auth required
- All tokens stored encrypted in `social_accounts`

---

## 💰 Plans

| Plan | Accounts | Posts/month | Price |
|---|---|---|---|
| Free | 3 | 10 | $0 |
| Pro | Unlimited | Unlimited | $19/month (post-launch via Stripe) |

**Enforce free plan limits in backend before creating posts.**

---

## 🚀 Session Start Message

When starting a new chat in this project, say:
> "PostPilot ready. Current phase: [week/phase]. What are we building?"

Then wait for the user's instruction.
