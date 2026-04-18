// backend/src/routes/accounts.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock dependencies
vi.mock('../db/supabase');

// Mock middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

import { supabase } from '../db/supabase';

const mockSupabase = supabase as any;

describe('Accounts Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('returns user social accounts successfully', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          platform: 'instagram',
          platform_username: 'test_account',
          platform_avatar_url: 'https://example.com/avatar.jpg',
          is_active: true,
          created_at: '2024-04-19T12:00:00.000Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockAccounts,
              error: null,
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/accounts');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockAccounts);
      expect(mockSupabase.from).toHaveBeenCalledWith('social_accounts');
    });

    it('returns empty array when no accounts', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/accounts');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('handles database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/accounts');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('returns a single account successfully', async () => {
      const mockAccount = {
        id: 'test-account-id',
        platform: 'facebook',
        platform_username: 'test_page',
        is_active: true,
        created_at: '2024-04-19T12:00:00.000Z',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAccount,
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/accounts/test-account-id');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockAccount);
    });

    it('returns 404 for non-existent account', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const res = await request(app).get('/api/accounts/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('toggles account active status successfully', async () => {
      // Mock finding existing account
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'test-account-id' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock updating account
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'test-account-id',
                  platform: 'instagram',
                  platform_username: 'test_account',
                  is_active: false,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .patch('/api/accounts/test-account-id')
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
    });

    it('returns 400 with invalid is_active value', async () => {
      const res = await request(app)
        .patch('/api/accounts/test-account-id')
        .send({ is_active: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent account', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const res = await request(app)
        .patch('/api/accounts/non-existent')
        .send({ is_active: false });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('deletes an account successfully', async () => {
      // Mock finding existing account
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'test-account-id' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock deleting account
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const res = await request(app).delete('/api/accounts/test-account-id');

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('returns 404 for non-existent account', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const res = await request(app).delete('/api/accounts/non-existent');
      expect(res.status).toBe(404);
    });
  });
});