// backend/src/db/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Platform = 'instagram' | 'facebook' | 'linkedin';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'delayed';
export type Plan = 'free' | 'pro' | 'unlimited';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: Plan;
          monthly_post_count: number;
          monthly_reset_at: string;
          daily_post_count: number;
          daily_reset_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
          monthly_post_count?: number;
          monthly_reset_at?: string;
          daily_post_count?: number;
          daily_reset_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Plan;
          monthly_post_count?: number;
          monthly_reset_at?: string;
          daily_post_count?: number;
          daily_reset_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          is_admin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          platform_account_id: string;
          platform_username: string;
          platform_avatar_url: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          page_id: string | null;
          page_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: Platform;
          platform_account_id: string;
          platform_username: string;
          platform_avatar_url?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          platform_username?: string;
          platform_avatar_url?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          page_id?: string | null;
          page_name?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          media_urls: string[];
          platforms: Platform[];
          status: PostStatus;
          scheduled_at: string | null;
          published_at: string | null;
          failure_reason: string | null;
          platform_post_ids: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          media_urls?: string[];
          platforms: Platform[];
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          failure_reason?: string | null;
          platform_post_ids?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          media_urls?: string[];
          platforms?: Platform[];
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          failure_reason?: string | null;
          platform_post_ids?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      post_analytics: {
        Row: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          platform: Platform;
          likes?: number;
          comments?: number;
          shares?: number;
          reach?: number;
          impressions?: number;
          clicks?: number;
          fetched_at?: string;
          created_at?: string;
        };
        Update: {
          likes?: number;
          comments?: number;
          shares?: number;
          reach?: number;
          impressions?: number;
          clicks?: number;
          fetched_at?: string;
        };
        Relationships: [];
      };
      scheduled_jobs: {
        Row: {
          id: string;
          post_id: string;
          bullmq_job_id: string;
          status: JobStatus;
          attempts: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          bullmq_job_id: string;
          status?: JobStatus;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: JobStatus;
          attempts?: number;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      increment_monthly_post_count: {
        Args: { user_id_input: string };
        Returns: undefined;
      };
      increment_post_counts: {
        Args: { user_id_input: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
