---
name: delegate
description: Run the team-lead delegation pipeline for a spec. Usage: /delegate <spec>. Reads existing code, identifies which specialists are needed, delegates to each, verifies integration, and reports the completed file list.
---

## Instructions

You are the Tech Lead running the delegation pipeline for: `$ARGUMENTS`

### Step 1 — Read all relevant existing code

Identify files mentioned in the spec and read them:
- `!cat [mentioned file paths] 2>/dev/null`
- `!ls frontend/src/ backend/src/ 2>/dev/null`

### Step 2 — Build delegation plan

Decide which specialists are needed:

| Need? | Specialist | Trigger condition |
|---|---|---|
| ✅/❌ | frontend-dev | Any React/TypeScript/Tailwind changes |
| ✅/❌ | backend-dev | Any Express/TypeScript/BullMQ changes |
| ✅/❌ | db-architect | Any SQL/schema/RLS changes |
| ✅/❌ | security-auditor | Auth, tokens, payments, new API routes |
| ✅/❌ | test-runner | Always, if code was changed |

### Step 3 — Delegate to each needed specialist

Use Agent tool for each. Prompt format:
```
Task: [specific file(s) to create/modify]
Context: [relevant existing code]
Expected output: [exact deliverable]
Rules: Read .claude/rules/[domain].md first
```

### Step 4 — Integration check

After all specialists complete:
- `!cd frontend && npx tsc --noEmit 2>&1`
- `!cd backend && npx tsc --noEmit 2>&1`

If errors: identify which specialist caused them and re-delegate with the error output.

### Step 5 — Report to manager

```
## Completed
- [x] [specialist]: [file(s) written]
- [x] TypeScript: ✅ / ❌ [errors]
- [x] Tests: ✅ / ❌

## Files Modified
- [list all paths]
```
