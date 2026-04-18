---
name: gen-schema
description: Generate or update the PostPilot database schema. Run /gen-schema to get complete schema.sql with all tables, RLS, triggers, and indexes. Optionally pass a table name to regenerate just that table.
---

## Instructions

You are generating SQL for the PostPilot Supabase database.

Read the database rules first from `.claude/rules/database.md`.

Then produce the complete, runnable `schema.sql` for the table(s) requested.

### Context to pull dynamically:
- Current git status: `!git status`
- Existing schema (if any): `!cat backend/src/db/schema.sql 2>/dev/null || echo "No schema yet"`

### Deliverables:
1. The complete SQL file (or requested table section)
2. The exact command to run it: "Paste this into Supabase SQL Editor → Run"
3. List of all policies created
4. List of all triggers created
5. Any indexes added with explanation of why

### Always include:
- `CREATE TABLE IF NOT EXISTS` (safe to re-run)
- `CREATE POLICY` for SELECT, INSERT, UPDATE, DELETE
- `updated_at` trigger
- Relevant indexes
- Comments explaining non-obvious columns

### Format:
```sql
-- File: backend/src/db/schema.sql
-- Generated: [date]
-- Tables: [list]

-- [content]

-- ✅ Run complete. Tables created: [list]
```
