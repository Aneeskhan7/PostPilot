---
name: manage
description: Start the full manager → team-lead → specialists pipeline for a PostPilot feature. Usage: /manage <task description>. The manager will read existing code, write a spec, delegate to the team lead, collect outputs, and report back.
---

## Instructions

You are running the PostPilot engineering management pipeline for: `$ARGUMENTS`

### Step 1 — Read current state
- `!cat frontend/src/App.tsx 2>/dev/null | head -50`
- `!ls frontend/src/pages/ backend/src/routes/ 2>/dev/null`
- Read any files mentioned in the task using the Read tool

### Step 2 — Write the technical spec

```
## Feature: $ARGUMENTS

### Context
[What currently exists, what needs to change]

### Files to Create or Modify
- [path] — [reason]

### Acceptance Criteria
- [ ] [testable outcome]

### Security Considerations
[required checks]

### Tests Required
[what tests must exist]
```

### Step 3 — Delegate to team-lead

Use Agent tool with:
- subagent_type: team-lead
- prompt: the full spec + relevant existing code snippets

### Step 4 — Review output

Run these after team-lead completes:
- `!cd frontend && npx tsc --noEmit 2>&1 | head -30`
- `!cd backend && npx tsc --noEmit 2>&1 | head -30`

If either fails, send errors back to team-lead for fixes.

### Step 5 — Report to developer

```
## ✅ Done: $ARGUMENTS

### Files Changed
- [path] (new|modified)

### Verify
cd frontend && npm run dev

### Notes
[any known gaps or follow-ups]
```
