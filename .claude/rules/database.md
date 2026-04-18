# Database Rules — PostPilot (Supabase / PostgreSQL)

## Schema Principles

- Every table has: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- Every table has: `created_at TIMESTAMPTZ DEFAULT NOW()`
- Every table has: `updated_at TIMESTAMPTZ DEFAULT NOW()` with auto-update trigger
- All timestamps stored in UTC, converted to user timezone only in UI
- Foreign keys always have `ON DELETE CASCADE` unless explicitly noted otherwise
- Column names: `snake_case` always

---

## Row Level Security (RLS)

**RLS is ENABLED on every table. No exceptions.**

Pattern for user-owned data:
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rows
CREATE POLICY "Users see own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own rows
CREATE POLICY "Users insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own rows
CREATE POLICY "Users update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own rows
CREATE POLICY "Users delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

**Backend uses service key (bypasses RLS) — add manual ownership checks in middleware.**

---

## The 5 Tables

### 1. profiles
Extends Supabase `auth.users`. Created automatically via trigger on signup.
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  monthly_post_count INTEGER NOT NULL DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. social_accounts
```sql
CREATE TABLE social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  platform_account_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  platform_avatar_url TEXT,
  access_token TEXT NOT NULL,        -- encrypted AES-256
  refresh_token TEXT,                -- encrypted AES-256 (nullable)
  token_expires_at TIMESTAMPTZ,
  page_id TEXT,                      -- Facebook/Instagram page ID
  page_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_account_id)
);
```

### 3. posts
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL CHECK (platforms <@ ARRAY['instagram','facebook','linkedin']),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  failure_reason TEXT,
  platform_post_ids JSONB DEFAULT '{}',   -- { "instagram": "xxx", "facebook": "yyy" }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for worker queue lookups
CREATE INDEX posts_status_scheduled_at ON posts(status, scheduled_at)
  WHERE status = 'scheduled';
```

### 4. post_analytics
```sql
CREATE TABLE post_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin')),
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. scheduled_jobs
```sql
CREATE TABLE scheduled_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  bullmq_job_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed', 'failed', 'delayed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Triggers

### Auto-update `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Auto-create profile on signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Monthly post count reset
```sql
CREATE OR REPLACE FUNCTION reset_monthly_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NOW() > OLD.monthly_reset_at THEN
    NEW.monthly_post_count = 0;
    NEW.monthly_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_monthly_count BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION reset_monthly_post_count();
```

---

## Query Performance Rules

- All foreign keys have indexes (Supabase auto-creates for FK columns)
- Add composite indexes for common multi-column queries
- Use `EXPLAIN ANALYZE` for any query that touches more than 1000 rows
- Paginate all list queries: `LIMIT 20 OFFSET ?` or cursor-based
- Never `SELECT *` in backend code — always explicit column lists

---

## Supabase Realtime

Enable Realtime on `posts` table for live status updates:
```sql
ALTER TABLE posts REPLICA IDENTITY FULL;
```

Then in frontend:
```typescript
supabase.channel('posts-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'posts',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Update TanStack Query cache
  })
  .subscribe();
```
