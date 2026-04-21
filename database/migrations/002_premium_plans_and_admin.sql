-- Migration 002: Premium plans + admin panel
-- Adds daily post limits, Stripe subscription tracking, admin flag
-- Run this on top of migration 001

-- 1. Update plan constraint to include 'unlimited'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'unlimited'));

-- 2. Add new columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_post_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_reset_at        TIMESTAMPTZ NOT NULL DEFAULT (DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
  ADD COLUMN IF NOT EXISTS is_admin              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Replace monthly-only reset trigger with daily+monthly reset trigger
DROP TRIGGER IF EXISTS reset_monthly_count ON profiles;
DROP TRIGGER IF EXISTS reset_post_counts ON profiles;

CREATE OR REPLACE FUNCTION reset_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NOW() > OLD.daily_reset_at THEN
    NEW.daily_post_count := 0;
    NEW.daily_reset_at   := DATE_TRUNC('day', NOW()) + INTERVAL '1 day';
  END IF;
  IF NOW() > OLD.monthly_reset_at THEN
    NEW.monthly_post_count := 0;
    NEW.monthly_reset_at   := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_post_counts
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION reset_post_counts();

-- 4. Add increment RPC (called by publish worker instead of old monthly-only version)
CREATE OR REPLACE FUNCTION increment_post_counts(user_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    daily_post_count   = daily_post_count + 1,
    monthly_post_count = monthly_post_count + 1,
    updated_at         = NOW()
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix handle_new_user trigger to be resilient to errors
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Repair any auth users that are missing a profiles row
INSERT INTO profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
