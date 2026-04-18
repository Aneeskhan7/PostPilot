---
name: gen-tests
description: Generate complete Vitest tests for a PostPilot file. Usage: /gen-tests <filepath> e.g. /gen-tests routes/posts.ts — produces all test cases covering success, auth failure, validation failure, not-found, and business logic errors.
---

## Instructions

You are generating a complete test file for PostPilot.

### Step 1: Read context
- Testing rules: `.claude/rules/testing.md`
- Target file: `!cat backend/src/$ARGUMENTS 2>/dev/null || cat frontend/src/$ARGUMENTS 2>/dev/null`
- Types file: `!cat backend/src/db/supabase.ts 2>/dev/null`

### Step 2: Determine test type

- If target is in `backend/src/routes/` → write **route integration tests** with supertest
- If target is in `backend/src/services/` → write **unit tests** with mocked dependencies
- If target is in `frontend/src/hooks/` → write **hook tests** with React Testing Library
- If target is in `frontend/src/components/` → write **component tests** with RTL

### Step 3: Generate the test file

Test file path: same directory as source, with `.test.ts` or `.test.tsx` extension.

For EVERY route, test ALL of these:
```
✅ 200/201 success path
❌ 401 no auth header
❌ 401 invalid token
❌ 403 wrong user's resource
❌ 400 validation error (bad body)
❌ 404 not found
❌ 422 plan limit (if applicable)
```

### Step 4: After the test file, provide

```
📁 Test file: [path]
🧪 Run tests: cd [backend|frontend] && npx vitest run [filename]
📊 Cases covered: [number] test cases
🎯 Coverage targets:
  - Lines: aim for 80%+
  - Branches: aim for 70%+

📋 What's tested:
  [list each test case and what it verifies]

⚠️ What's NOT tested (follow-up needed):
  [list any edge cases not covered]
```
