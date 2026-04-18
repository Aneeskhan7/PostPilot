# PostPilot — Complete Claude Environment Setup Guide

**Build a production-grade social media scheduler with a Claude developer team working for you.**

---

## What You're Setting Up

This guide creates a full Claude Code environment that acts like a 5-person developer team:

| Agent | Role | When to use |
|---|---|---|
| `db-architect` | Database designer | Schema, migrations, RLS, triggers |
| `backend-dev` | Node.js/Express engineer | API routes, services, middleware |
| `frontend-dev` | React/TypeScript engineer | Pages, components, hooks |
| `test-runner` | QA engineer | Tests, coverage, debugging |
| `deploy-agent` | DevOps engineer | Vercel, Railway, CI/CD |
| `security-auditor` | Security specialist | Audits, token safety, auth review |

Plus 5 slash commands (skills) that act like expert workflows:

| Skill | Usage | What it does |
|---|---|---|
| `/gen-schema` | `/gen-schema` | Generates complete schema.sql |
| `/gen-backend` | `/gen-backend routes/posts.ts` | Generates a complete backend file |
| `/gen-frontend` | `/gen-frontend pages/Dashboard.tsx` | Generates a complete React component |
| `/gen-tests` | `/gen-tests routes/posts.ts` | Generates all test cases |
| `/deploy` | `/deploy frontend` | Full deploy with pre-flight checks |
| `/security-audit` | `/security-audit all` | Security scan of whole project |

---

## Part 1: Understand the File Architecture

### Three layers of Claude configuration:

```
postpilot/
│
├── CLAUDE.md                    ← Layer 1: Project instructions (committed, all devs see it)
├── CLAUDE.local.md              ← Layer 2: Your personal notes (gitignored, just for you)
│
└── .claude/
    ├── settings.json            ← Team permissions (committed)
    ├── settings.local.json      ← Your personal overrides (gitignored)
    ├── MEMORY.md                ← Claude's auto-memory across sessions
    │
    ├── agents/                  ← Subagent definitions (your developer team)
    │   ├── db-architect.md
    │   ├── backend-dev.md
    │   ├── frontend-dev.md
    │   ├── test-runner.md
    │   ├── deploy-agent.md
    │   └── security-auditor.md
    │
    ├── skills/                  ← Slash commands (expert workflows)
    │   ├── gen-schema/SKILL.md
    │   ├── gen-backend/SKILL.md
    │   ├── gen-frontend/SKILL.md
    │   ├── gen-tests/SKILL.md
    │   ├── deploy/SKILL.md
    │   └── security-audit/SKILL.md
    │
    └── rules/                   ← Scoped rules (loaded per topic)
        ├── backend.md
        ├── database.md
        ├── security.md
        ├── testing.md
        └── frontend/
            └── react.md
```

**Why this structure?**
- CLAUDE.md loads in every session automatically → always has project context
- Rules files are loaded on-demand → keeps CLAUDE.md under 500 lines
- Agents are invoked explicitly → delegate complex tasks to specialists
- Skills are slash commands → repeatable expert workflows
- MEMORY.md persists insights across sessions → Claude remembers what worked

---

## Part 2: Install Claude Code (CLI)

Claude Code is the terminal tool that makes all this work.

```bash
# Requires Node.js 18+
node --version  # must be 18 or higher

# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# Login with your Anthropic account
claude login
```

> **Note:** Claude Code is separate from claude.ai. You use it in your terminal, inside your project folder.

---

## Part 3: Copy the Environment Files into Your Project

You received a zip/folder with these files. Here's exactly where each file goes:

### Step 3.1 — Copy root files

```bash
cd postpilot  # your project root

# Copy the main CLAUDE.md (project instructions)
cp /path/to/delivered-files/CLAUDE.md ./CLAUDE.md

# Copy your personal notes template (gitignored)
cp /path/to/delivered-files/CLAUDE.local.md ./CLAUDE.local.md

# Copy gitignore
cp /path/to/delivered-files/.gitignore ./.gitignore
```

### Step 3.2 — Copy the .claude folder

```bash
# Copy the entire .claude directory
cp -r /path/to/delivered-files/.claude ./.claude

# Verify the structure
find .claude -type f | sort
```

You should see:
```
.claude/MEMORY.md
.claude/settings.json
.claude/agents/backend-dev.md
.claude/agents/db-architect.md
.claude/agents/deploy-agent.md
.claude/agents/frontend-dev.md
.claude/agents/security-auditor.md
.claude/agents/test-runner.md
.claude/rules/backend.md
.claude/rules/database.md
.claude/rules/frontend/react.md
.claude/rules/security.md
.claude/rules/testing.md
.claude/skills/db-schema/SKILL.md
.claude/skills/gen-backend/SKILL.md
.claude/skills/gen-frontend/SKILL.md
.claude/skills/gen-tests/SKILL.md
.claude/skills/deploy/SKILL.md
.claude/skills/security-audit/SKILL.md
```

---

## Part 4: Initialize Claude Code in Your Project

```bash
cd postpilot

# Initialize Claude Code (reads your CLAUDE.md and .claude/ folder)
claude

# Claude will say:
# "PostPilot ready. Current phase: Week 1. What are we building?"
```

That's the session start message from CLAUDE.md — it means Claude has loaded your project context.

---

## Part 5: How to Use Each Feature

---

### 5.1 Using the Main Claude (everyday chat)

For simple questions and file generation, just talk to Claude:

```
You: Give me services/meta.ts now

Claude: [reads .claude/rules/backend.md, .claude/rules/security.md]
        [produces complete meta.ts file]
        [tells you exact command to run]
```

---

### 5.2 Using Agents (delegating to specialists)

Invoke an agent when the task needs a specialist's deep focus:

```bash
# Database work
claude "Use the db-architect agent to design the schema for a new notifications table"

# Backend file
claude "Use the backend-dev agent to build routes/posts.ts completely"

# Frontend component
claude "Use the frontend-dev agent to build the Composer page with platform selector and scheduler"

# Testing
claude "Use the test-runner agent to write all tests for routes/posts.ts"

# Security review
claude "Use the security-auditor agent to audit the OAuth flow in routes/auth.ts"

# Deploy
claude "Use the deploy-agent to walk me through deploying the backend to Railway"
```

**When to use an agent vs. just asking Claude:**
- Use agents for: full files, complex multi-step tasks, specialized domains
- Use main Claude for: quick questions, small edits, explanations

---

### 5.3 Using Skills (slash commands)

Skills are pre-built expert workflows you trigger with `/`:

```bash
# Generate schema.sql
claude "/gen-schema"

# Generate a backend file
claude "/gen-backend routes/posts.ts"
claude "/gen-backend services/meta.ts"
claude "/gen-backend middleware/auth.ts"

# Generate a frontend file
claude "/gen-frontend pages/Dashboard.tsx"
claude "/gen-frontend components/PostCard.tsx"
claude "/gen-frontend hooks/usePosts.ts"

# Generate tests for a file
claude "/gen-tests routes/posts.ts"
claude "/gen-tests services/meta.ts"

# Deploy
claude "/deploy frontend"
claude "/deploy backend"
claude "/deploy all"

# Security audit
claude "/security-audit routes/auth.ts"
claude "/security-audit all"
```

---

### 5.4 Using Rules (automatic context)

Rules files are loaded automatically when relevant. You don't invoke them directly — they're referenced by agents and skills. But you can ask Claude to follow specific rules:

```bash
# Claude automatically reads backend.md when building backend files
claude "Build routes/accounts.ts following our backend rules"

# Explicitly reference a rule file
claude "Check routes/auth.ts against our security rules"

# Ask Claude to explain a rule
claude "What does our database.md say about RLS policies?"
```

---

### 5.5 Using Memory (cross-session context)

Claude's MEMORY.md persists across sessions. Update it yourself or ask Claude to update it:

```bash
# Ask Claude to record a decision
claude "Record in MEMORY.md: we decided to use cursor-based pagination for the posts list"

# Ask Claude to record a bug fix
claude "Add to MEMORY.md bugs section: Instagram container publish fails if image URL has query params — strip them"

# Check current memory
claude "What does our MEMORY.md say about the current project status?"

# Start a session and have Claude read memory first
claude "Read MEMORY.md and tell me where we left off"
```

---

## Part 6: The Complete Build Workflow

Here's exactly how to use this environment to build PostPilot week by week.

---

### Week 1: Database + Core Services

**Start every session with:**
```bash
cd postpilot && claude
# Claude says: "PostPilot ready. Current phase: Week 1."
```

**Day 1 — Schema**
```bash
claude "/gen-schema"
# → Paste output into Supabase SQL Editor → Run
# → Verify: see 5 tables in Supabase dashboard
```

**Day 1 — Backend Supabase singleton**
```bash
claude "/gen-backend db/supabase.ts"
# → Copy to backend/src/db/supabase.ts
# → Run: cd backend && npx tsx src/db/supabase.ts
```

**Day 2 — Auth middleware**
```bash
claude "/gen-backend middleware/auth.ts"
claude "/gen-backend middleware/errorHandler.ts"
# → Copy files
# → Run: cd backend && npm run dev (check no errors)
```

**Day 3 — Meta service**
```bash
claude "Use the backend-dev agent to build services/meta.ts — complete implementation of Instagram and Facebook publishing"
# → Copy file
# → Generate tests: claude "/gen-tests services/meta.ts"
```

**Day 4 — LinkedIn service**
```bash
claude "/gen-backend services/linkedin.ts"
claude "/gen-tests services/linkedin.ts"
```

**Day 5 — Auth routes + Scheduler + Worker**
```bash
claude "/gen-backend routes/auth.ts"
claude "/gen-backend services/scheduler.ts"
claude "/gen-backend workers/publishWorker.ts"
```

**End of Week 1 — Security check**
```bash
claude "/security-audit backend/src/routes/auth.ts"
claude "/security-audit backend/src/services/"
```

---

### Week 2: Backend API + Auth Pages

**Day 1-2 — Posts + Accounts + Media routes**
```bash
claude "/gen-backend routes/posts.ts"
claude "/gen-tests routes/posts.ts"

claude "/gen-backend routes/accounts.ts"
claude "/gen-tests routes/accounts.ts"

claude "/gen-backend routes/media.ts"
claude "/gen-backend services/storage.ts"
```

**Day 3 — Token manager + Express entry**
```bash
claude "/gen-backend services/tokenManager.ts"
claude "/gen-backend index.ts"
# → Run full backend: cd backend && npm run dev
# → Test: curl http://localhost:4000/health
```

**Day 4-5 — Frontend foundation**
```bash
claude "/gen-frontend lib/supabase.ts"
claude "/gen-frontend store/authStore.ts"
claude "/gen-frontend pages/Login.tsx"
```

---

### Week 3: Frontend Pages + Components

**Day 1**
```bash
claude "/gen-frontend hooks/useAuth.ts"
claude "/gen-frontend hooks/usePosts.ts"
claude "/gen-frontend hooks/useAccounts.ts"
```

**Day 2**
```bash
claude "/gen-frontend components/Sidebar.tsx"
claude "/gen-frontend components/AccountBadge.tsx"
claude "/gen-frontend components/PostCard.tsx"
```

**Day 3-4**
```bash
claude "/gen-frontend pages/Dashboard.tsx"
claude "/gen-frontend components/MediaUploader.tsx"
claude "/gen-frontend components/PlatformPreview.tsx"
claude "/gen-frontend pages/Composer.tsx"
```

**Day 5**
```bash
claude "/gen-frontend pages/Calendar.tsx"
claude "/gen-frontend pages/History.tsx"
claude "/gen-frontend pages/Settings.tsx"
```

---

### Week 4: AI + Analytics + Deploy

**Day 1-2 — AI + Analytics**
```bash
claude "/gen-backend routes/ai.ts"
claude "/gen-backend routes/analytics.ts"
claude "/gen-frontend pages/History.tsx"  # add analytics section
```

**Day 3-4 — Deploy**
```bash
claude "/deploy frontend"   # walks through Vercel deploy
claude "/deploy backend"    # walks through Railway deploy
```

**Day 5 — Final security audit**
```bash
claude "/security-audit all"
# Fix any CRITICAL or HIGH issues before going live
```

---

## Part 7: Debugging with Claude

When something breaks:

```bash
# Show Claude the error
claude "I'm getting this error: [paste error]
        Here's the file: [paste file or say which file]
        What's wrong and how do I fix it?"

# Ask for a specific kind of help
claude "Use the test-runner agent to debug why posts.test.ts is failing — 
        the 403 test passes but the 401 test always returns 500"

# Ask Claude to read the actual file
claude "Read backend/src/routes/posts.ts and find the bug causing 
        users to see other users' posts"
```

---

## Part 8: Committing and Version Control

```bash
# What to commit
git add CLAUDE.md
git add .claude/settings.json
git add .claude/agents/
git add .claude/skills/
git add .claude/rules/
git add .claude/MEMORY.md
git add backend/src/
git add frontend/src/

# What NOT to commit (already in .gitignore)
# .env, CLAUDE.local.md, .claude/settings.local.json, node_modules/
```

Commit message format:
```
feat(posts): add POST /api/posts route with BullMQ scheduling

- Zod validation for content and platforms
- Free plan limit check (422 if over 10/month)
- BullMQ job created with delay = scheduledAt - now()
- Tests: 7 cases covering success, auth, validation, limits
```

---

## Part 9: Quick Reference Card

### Starting a session
```bash
cd postpilot && claude
```

### Building the next file
```bash
claude "/gen-backend routes/posts.ts"
claude "/gen-frontend pages/Dashboard.tsx"
```

### After building — test it
```bash
claude "/gen-tests routes/posts.ts"
cd backend && npx vitest run src/routes/posts.test.ts
```

### Before deploying — audit it
```bash
claude "/security-audit all"
```

### Deploying
```bash
claude "/deploy all"
```

### When stuck
```bash
claude "Read MEMORY.md — have we hit this error before? [paste error]"
```

---

## Part 10: Environment Variables Checklist

Fill these in before starting Week 1:

**Supabase** (from supabase.com → Settings → API)
- [ ] `SUPABASE_URL` — looks like `https://xxxx.supabase.co`
- [ ] `SUPABASE_SERVICE_KEY` — "service_role" key (long, starts with `eyJ`)
- [ ] `VITE_SUPABASE_URL` — same as SUPABASE_URL
- [ ] `VITE_SUPABASE_ANON_KEY` — "anon" key (different from service key)

**Meta** (from developers.facebook.com → your app → Settings → Basic)
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`

**LinkedIn** (from linkedin.com/developers/apps → your app → Auth)
- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`

**Redis**
- [ ] `REDIS_URL` — from Railway, or `redis://localhost:6379` for local

**Security**
- [ ] `TOKEN_ENCRYPTION_KEY` — generate with: `openssl rand -hex 32`

**Optional**
- [ ] `OPENAI_API_KEY` — for AI caption generation (Week 4)

---

## You're Ready

Your Claude environment is fully set up. You have:

✅ A master CLAUDE.md that gives Claude permanent project context
✅ 6 specialist agents acting as your developer team
✅ 6 skills (slash commands) for expert workflows
✅ 5 rule files keeping code quality consistent
✅ Auto-memory that persists knowledge across sessions
✅ Security built in from day one, not bolted on at the end
✅ A clear 4-week build order to follow

**Start building:**
```bash
cd postpilot && claude
```

Then type: `"/gen-schema"` — and your database is done.
