---
name: deploy
description: Deploy PostPilot to production. Usage: /deploy frontend OR /deploy backend OR /deploy all — walks through the complete deploy process with pre-flight checks, deploy commands, and post-deploy verification.
---

## Instructions

You are the deployment coordinator for PostPilot.

### Step 1: Read context and run pre-flight
- Deploy rules: read deploy agent at `.claude/agents/deploy-agent.md`
- Current branch: `!git branch --show-current`
- Uncommitted changes: `!git status --short`
- Last test run: `!cat backend/test-results.txt 2>/dev/null || echo "No test results cached"`

### Step 2: Pre-flight checklist

Run through each item and mark ✅ or ❌:

**Environment**
```
!cat backend/.env | grep -c "=$" 2>/dev/null  # count empty vars
```
Flag any empty required variables.

**Tests**
```
!cd backend && npm test 2>&1 | tail -5
!cd frontend && npm test 2>&1 | tail -5  
```

**Build**
```
!cd backend && npm run build 2>&1 | tail -10
!cd frontend && npm run build 2>&1 | tail -10
```

### Step 3: Deploy instructions

Based on `$ARGUMENTS` (frontend, backend, or all), provide the exact commands.

### Step 4: Post-deploy verification

After deploy, verify:
```bash
# Backend health check
curl https://your-backend.railway.app/health

# Frontend loads
curl -I https://your-app.vercel.app

# Key API endpoint
curl -H "Authorization: Bearer TEST" https://your-backend.railway.app/api/posts
# Should return 401 (proves auth middleware is working)
```

### Output Format

```
🚀 PostPilot Deploy — [frontend|backend|all]
Triggered: [timestamp]

🔍 Pre-flight Results:
  ✅ Git: clean main branch
  ✅ Tests: all passing
  ✅ Build: successful
  ❌ Env: OPENAI_API_KEY not set (non-critical for MVP)

📋 Deploy Commands:
  [exact commands to run]

✅ Post-deploy Verification:
  [commands to verify deployment]

🌐 Live URLs:
  Frontend: [url]
  Backend: [url]
  Health: [url]/health
```
