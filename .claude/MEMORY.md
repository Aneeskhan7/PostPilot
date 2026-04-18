# PostPilot — Claude's Session Memory

> This file is written and read by Claude across sessions.
> First 200 lines auto-loaded into every new session.
> Claude updates this during sessions with what it learns.

---

## Project Status

Current week: **Week 1**
Last completed file: *(not started)*
Next file to build: `backend/src/db/schema.sql`

---

## Decisions Made

<!-- Claude records architectural decisions here -->
- Token encryption: AES-256-GCM with random IV per operation
- Queue concurrency: 5 parallel publish jobs
- Free plan: 10 posts/month, 3 accounts (enforced server-side)
- Instagram: 2-step publish (container create → publish)
- All timestamps: UTC in DB, convert to user timezone in UI only

---

## Bugs We've Fixed

<!-- Claude records bugs and their fixes here to avoid repeating them -->
*(none yet — will be populated as development progresses)*

---

## User Preferences

<!-- Claude records how this developer likes to work -->
- Prefers: one file at a time, complete files only
- Testing: wants tests for every route file
- Style: strict TypeScript, no any types
- Commit style: *(not set yet)*

---

## Important Context

<!-- Things Claude should remember across sessions -->
- This is a solo developer building a production SaaS
- Primary concern: getting a working MVP fast, not premature optimization
- Deployment target: Vercel (frontend) + Railway (backend)
- Free plan limits must be enforced — this is a paid product
- Meta App is NOT in Live mode yet — use sandbox accounts for testing

---

## Open Questions

<!-- Things that need decisions -->
- [ ] Should we add Stripe in Week 4 or post-launch?
- [ ] LinkedIn company page posting — post-launch (needs API approval)
- [ ] Should analytics page poll or use Supabase Realtime?

---

*Claude updates this file at the end of each session with new learnings.*
