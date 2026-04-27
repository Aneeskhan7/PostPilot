-- Migration: add columns required by billing + plan enforcement
-- Run this once in your Supabase SQL editor if you set up the DB before billing was added.

-- Add stripe_subscription_id if missing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add daily post-count tracking if missing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_post_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day');

-- Add admin flag if missing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Widen plan constraint to include 'unlimited'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'unlimited'));

-- DB function used by publish worker to increment both daily and monthly counters
CREATE OR REPLACE FUNCTION increment_post_counts(user_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    monthly_post_count = monthly_post_count + 1,
    daily_post_count   = daily_post_count   + 1
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql;
