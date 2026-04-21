-- ═══════════════════════════════════════════════════════════════
-- PostPilot — Complete Database Schema
-- Project: ybnryiirtrlvoykieikl (Supabase)
-- Last updated: 2026-04-20
--
-- Run this file in Supabase SQL Editor on a fresh project.
-- For existing projects, run migrations/ files instead.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- FUNCTION: auto-update updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TABLE: profiles
-- Extends auth.users — created automatically on signup via trigger
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                 TEXT NOT NULL,
  full_name             TEXT,
  avatar_url            TEXT,

  -- Plan & billing
  plan                  TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'pro', 'unlimited')),
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,

  -- Post counters
  monthly_post_count    INTEGER NOT NULL DEFAULT 0,
  monthly_reset_at      TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  daily_post_count      INTEGER NOT NULL DEFAULT 0,
  daily_reset_at        TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('day', NOW()) + INTERVAL '1 day',

  -- Admin
  is_admin              BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- TABLE: social_accounts
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE social_accounts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform              TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  platform_account_id   TEXT NOT NULL,
  platform_username     TEXT NOT NULL,
  platform_avatar_url   TEXT,
  access_token          TEXT NOT NULL,       -- AES-256-GCM encrypted
  refresh_token         TEXT,                -- AES-256-GCM encrypted (nullable)
  token_expires_at      TIMESTAMPTZ,
  page_id               TEXT,               -- Facebook/Instagram page ID
  page_name             TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_account_id)
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own accounts"
  ON social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own accounts"
  ON social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own accounts"
  ON social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own accounts"
  ON social_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- TABLE: posts
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE posts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content           TEXT NOT NULL,
  media_urls        TEXT[] DEFAULT '{}',
  platforms         TEXT[] NOT NULL CHECK (platforms <@ ARRAY['instagram','facebook','linkedin']),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  failure_reason    TEXT,
  platform_post_ids JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX posts_status_scheduled_at
  ON posts(status, scheduled_at)
  WHERE status = 'scheduled';

-- Enable Realtime for live status updates on frontend
ALTER TABLE posts REPLICA IDENTITY FULL;

-- ═══════════════════════════════════════════════════════════════
-- TABLE: post_analytics
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE post_analytics (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  likes       INTEGER DEFAULT 0,
  comments    INTEGER DEFAULT 0,
  shares      INTEGER DEFAULT 0,
  reach       INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analytics"
  ON post_analytics FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM posts WHERE id = post_id));

-- ═══════════════════════════════════════════════════════════════
-- TABLE: scheduled_jobs
-- BullMQ job tracking per post
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE scheduled_jobs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id       UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  bullmq_job_id TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'active', 'completed', 'failed', 'delayed')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own jobs"
  ON scheduled_jobs FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM posts WHERE id = post_id));

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION + TRIGGER: auto-create profile on signup
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION + TRIGGER: reset daily + monthly post counts
-- ═══════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION: increment daily + monthly post counts (called by publish worker)
-- ═══════════════════════════════════════════════════════════════
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
