import { vi } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env' });

// Set required test environment variables
process.env.NODE_ENV = 'test';
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.META_APP_ID = 'test-meta-id';
process.env.META_APP_SECRET = 'test-meta-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';
process.env.STRIPE_PRO_PRICE_ID = 'price_test_pro';
process.env.STRIPE_UNLIMITED_PRICE_ID = 'price_test_unlimited';
process.env.META_REDIRECT_URI = 'http://localhost:4000/auth/meta/callback';
process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:4000/auth/linkedin/callback';

// Global test helpers
export const createMockSupabase = (overrides: any = {}) => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  ...overrides,
});

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

export const mockPost = {
  id: 'test-post-id',
  user_id: 'test-user-id',
  content: 'Test post content',
  platforms: ['instagram'],
  status: 'draft',
  scheduled_at: null,
  created_at: '2024-04-19T12:00:00.000Z',
};