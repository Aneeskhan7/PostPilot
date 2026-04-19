// backend/src/routes/admin.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { requireAdmin } from '../middleware/requireAdmin';
import { AppError } from '../middleware/errorHandler';
import type { Plan } from '../db/types';

const router = Router();
router.use(requireAdmin);

const VALID_PLANS: Plan[] = ['free', 'pro', 'unlimited'];

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [usersResult, postsResult, todayPostsResult] = await Promise.all([
      supabase.from('profiles').select('plan', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact' }),
      supabase.from('posts')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    ]);

    const profiles = usersResult.data ?? [];
    const planDistribution: Record<Plan, number> = { free: 0, pro: 0, unlimited: 0 };
    for (const p of profiles) {
      const plan = (p.plan ?? 'free') as Plan;
      planDistribution[plan] = (planDistribution[plan] ?? 0) + 1;
    }

    res.json({
      data: {
        total_users: usersResult.count ?? 0,
        plan_distribution: planDistribution,
        total_posts: postsResult.count ?? 0,
        posts_today: todayPostsResult.count ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users?page=1&limit=20
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;

    const { data: profiles, error, count } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan, daily_post_count, monthly_post_count, stripe_customer_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Count social accounts per user
    const userIds = (profiles ?? []).map((p) => p.id);
    const { data: accountCounts } = await supabase
      .from('social_accounts')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_active', true);

    const countMap: Record<string, number> = {};
    for (const row of accountCounts ?? []) {
      countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
    }

    const users = (profiles ?? []).map((p) => ({
      ...p,
      social_accounts_count: countMap[p.id] ?? 0,
    }));

    res.json({ data: users, total: count ?? 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, plan, daily_post_count, monthly_post_count, stripe_customer_id, stripe_subscription_id, is_admin, created_at, updated_at')
      .eq('id', req.params.id)
      .single();

    if (profileErr || !profile) throw new AppError('User not found', 404, 'NOT_FOUND');

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id, platform, platform_username, platform_avatar_url, page_name, is_active, token_expires_at, created_at')
      .eq('user_id', req.params.id)
      .order('platform');

    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('user_id', req.params.id);

    res.json({ data: { ...profile, social_accounts: accounts ?? [], total_posts: postCount ?? 0 } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/plan
router.patch('/users/:id/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan } = z.object({ plan: z.enum(['free', 'pro', 'unlimited']) }).parse(req.body);

    const { data: existing, error: findErr } = await supabase
      .from('profiles')
      .select('id, plan')
      .eq('id', req.params.id)
      .single();

    if (findErr || !existing) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updates: { plan: Plan; stripe_subscription_id?: null } = { plan };
    if (plan === 'free') updates.stripe_subscription_id = null;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw new Error(error.message);

    res.json({ data: { id: req.params.id, plan } });
  } catch (err) {
    next(err);
  }
});

// Satisfy linter — VALID_PLANS is used for doc clarity
void VALID_PLANS;

export default router;
