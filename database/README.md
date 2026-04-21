# PostPilot Database

Supabase project: `ybnryiirtrlvoykieikl` · Region: `ap-south-1`

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Complete current schema — run on a fresh project |
| `seed.sql` | Sets admin flag for the admin account |
| `migrations/001_initial_schema.sql` | Week 1 initial tables + RLS + triggers |
| `migrations/002_premium_plans_and_admin.sql` | Daily limits, Stripe columns, admin flag |

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users — plan, post counts, admin flag |
| `social_accounts` | Connected Instagram/Facebook/LinkedIn with encrypted tokens |
| `posts` | Content, platforms, status, scheduled_at |
| `post_analytics` | Likes/comments/reach per platform per post |
| `scheduled_jobs` | BullMQ job tracking per post |

## Fresh Setup

Run in Supabase SQL Editor in this order:
1. `schema.sql`
2. `seed.sql`

## Existing Project (apply changes only)

Run each migration in order that hasn't been applied yet:
1. `migrations/001_initial_schema.sql`
2. `migrations/002_premium_plans_and_admin.sql`

## Plan Limits

| Plan | Posts/day | Price |
|------|-----------|-------|
| free | 2 | $0 |
| pro | 8 | $3/mo |
| unlimited | no limit | $9/mo |

Daily counter resets at UTC midnight via `reset_post_counts` trigger.
