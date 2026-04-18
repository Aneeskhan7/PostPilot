---
name: gen-frontend
description: Generate a complete frontend React/TypeScript file for PostPilot. Usage: /gen-frontend <filepath> e.g. /gen-frontend pages/Dashboard.tsx — produces the complete, accessible, responsive TypeScript component ready to use.
---

## Instructions

You are generating a frontend TypeScript/React file for PostPilot.

### Step 1: Read context
- Frontend rules: `.claude/rules/frontend/react.md`
- Shared types: `!cat frontend/src/types/index.ts 2>/dev/null`
- Auth store: `!cat frontend/src/store/authStore.ts 2>/dev/null`
- Existing hooks: `!ls frontend/src/hooks/ 2>/dev/null`
- Current file (if editing): `!cat frontend/src/$ARGUMENTS 2>/dev/null`

### Step 2: Generate the file

Produce the COMPLETE file. Requirements:
- Line 1: `// frontend/src/$ARGUMENTS`
- All imports included (no missing imports)
- Zero `any` types — strict TypeScript
- Props typed with explicit interfaces
- Three states handled: loading (skeleton), error (red alert), success
- Accessible: labels, aria-attributes, keyboard navigation
- Responsive: mobile-first Tailwind

### Step 3: After the file, provide

```
📁 File: frontend/src/$ARGUMENTS
📦 New dependencies needed: [list or "none"]
🔗 Register in: [e.g., "Add route in App.tsx" or "Import in parent component"]
🎨 Design tokens used: [list the Tailwind patterns]
♿ Accessibility notes: [key a11y decisions]
🧪 Test command: cd frontend && npm run dev → navigate to [route]
✅ Checklist:
  [ ] Loading state shown with skeleton
  [ ] Error state shown with message
  [ ] All interactive elements have labels
  [ ] Mobile-responsive
  [ ] No any types
  [ ] All imports included
```
