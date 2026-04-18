// frontend/src/types/index.ts
import type { User, Session } from '@supabase/supabase-js';

export type { User, Session };

export type Platform = 'instagram' | 'facebook' | 'linkedin';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type Plan = 'free' | 'pro';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  monthly_post_count: number;
  monthly_reset_at: string;
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  platform_account_id: string;
  platform_username: string;
  platform_avatar_url: string | null;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  content: string;
  media_urls: string[];
  platforms: Platform[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  failure_reason: string | null;
  platform_post_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  platform: Platform;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  clicks: number;
  fetched_at: string;
}

export interface CreatePostInput {
  content: string;
  platforms: Platform[];
  media_urls?: string[];
  scheduled_at?: string;
}

export interface UpdatePostInput {
  content?: string;
  platforms?: Platform[];
  media_urls?: string[];
  scheduled_at?: string | null;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code: string;
}
