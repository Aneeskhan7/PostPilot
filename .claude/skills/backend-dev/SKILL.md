---
name: gen-backend
description: Generate a complete backend file for PostPilot. Usage: /gen-backend <filepath> e.g. /gen-backend routes/posts.ts — produces the complete, tested, TypeScript file ready to paste into your project.
---

## Instructions

You are generating a backend TypeScript file for PostPilot.

### Step 1: Read context
- Backend rules: `.claude/rules/backend.md`
- Security rules: `.claude/rules/security.md`
- Existing types: `!cat backend/src/db/supabase.ts 2>/dev/null`
- Current file (if editing): `!cat backend/src/$ARGUMENTS 2>/dev/null`

### Step 2: Generate the file

Produce the COMPLETE file. Requirements:
- Line 1: `// backend/src/$ARGUMENTS`
- All imports included
- Zero `any` types
- Zod validation for all request bodies (routes only)
- Try/catch with `next(error)` in all route handlers
- Type-safe Supabase queries with explicit column selects
- Proper HTTP status codes
- Meaningful error messages

### Step 3: After the file, provide

```
📁 File: backend/src/$ARGUMENTS
📦 New dependencies needed: [list or "none"]
🔗 Register in: [e.g., "Add to index.ts: app.use('/api/posts', postsRouter)"]
🧪 Test command: cd backend && npx tsx src/$ARGUMENTS (if standalone) OR cd backend && npm run dev
✅ Checklist:
  [ ] Zod schema validates all inputs
  [ ] requireAuth on all protected routes
  [ ] Ownership check: user can only touch their own data
  [ ] Error handler receives errors via next(error)
  [ ] No any types
```
