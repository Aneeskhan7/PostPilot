// backend/src/routes/posts.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { schedulePost, cancelPost, reschedulePost } from '../services/scheduler';
import type { Plan } from '../db/types';

const router = Router();

const PLATFORMS = ['instagram', 'facebook', 'linkedin'] as const;

const CreatePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2200, 'Content too long'),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'Select at least one platform'),
  media_urls: z.array(z.string().url()).max(10).default([]),
  scheduled_at: z.string().datetime().optional(),
});

const UpdatePostSchema = z.object({
  content: z.string().min(1).max(2200).optional(),
  platforms: z.array(z.enum(PLATFORMS)).min(1).optional(),
  media_urls: z.array(z.string().url()).max(10).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
});

const PLAN_DAILY_LIMITS: Record<Plan, number | null> = {
  free: 2,
  pro: 8,
  unlimited: null,
};

async function enforcePlanLimit(userId: string): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, daily_post_count, daily_reset_at')
    .eq('id', userId)
    .single();

  if (!profile) throw new AppError('Profile not found', 404, 'NOT_FOUND');

  const now = new Date();
  const resetAt = new Date(profile.daily_reset_at);
  const effectiveCount = now > resetAt ? 0 : profile.daily_post_count;

  const limit = PLAN_DAILY_LIMITS[profile.plan];
  if (limit !== null && effectiveCount >= limit) {
    throw new AppError(
      `${profile.plan} plan limit reached (${limit} posts/day)`,
      422,
      'PLAN_LIMIT_REACHED'
    );
  }
}

// GET /api/posts — list all posts for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = '20', offset = '0' } = req.query as Record<string, string>;

    let query = supabase
      .from('posts')
      .select('id, content, media_urls, platforms, status, scheduled_at, published_at, failure_reason, platform_post_ids, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status as import('../db/types').PostStatus);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id — get a single post
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, media_urls, platforms, status, scheduled_at, published_at, failure_reason, platform_post_ids, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) throw new AppError('Post not found', 404, 'NOT_FOUND');

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — create a new post
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreatePostSchema.parse(req.body);
    await enforcePlanLimit(req.user.id);

    const status = body.scheduled_at ? 'scheduled' : 'draft';

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: req.user.id,
        content: body.content,
        platforms: body.platforms,
        media_urls: body.media_urls,
        status,
        scheduled_at: body.scheduled_at ?? null,
      })
      .select('id, content, media_urls, platforms, status, scheduled_at, created_at')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to create post');

    if (status === 'scheduled' && body.scheduled_at) {
      await schedulePost(data.id, new Date(body.scheduled_at));
    }

    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/posts/:id — update a post (draft or scheduled only)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdatePostSchema.parse(req.body);

    const { data: existing, error: findError } = await supabase
      .from('posts')
      .select('id, status, scheduled_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !existing) throw new AppError('Post not found', 404, 'NOT_FOUND');

    if (!['draft', 'scheduled'].includes(existing.status)) {
      throw new AppError('Only draft or scheduled posts can be edited', 422, 'INVALID_STATUS');
    }

    const updates: {
      content?: string;
      platforms?: ('instagram' | 'facebook' | 'linkedin')[];
      media_urls?: string[];
      scheduled_at?: string | null;
      status?: import('../db/types').PostStatus;
    } = {};
    if (body.content !== undefined) updates.content = body.content;
    if (body.platforms !== undefined) updates.platforms = body.platforms;
    if (body.media_urls !== undefined) updates.media_urls = body.media_urls;

    if (body.scheduled_at !== undefined) {
      updates.scheduled_at = body.scheduled_at;
      updates.status = body.scheduled_at ? 'scheduled' : 'draft';
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, content, media_urls, platforms, status, scheduled_at, updated_at')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update post');

    // Handle rescheduling
    if (body.scheduled_at !== undefined) {
      if (body.scheduled_at === null) {
        await cancelPost(req.params.id);
      } else if (existing.status === 'scheduled') {
        await reschedulePost(req.params.id, new Date(body.scheduled_at));
      } else {
        await schedulePost(req.params.id, new Date(body.scheduled_at));
      }
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id — delete a post
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !existing) throw new AppError('Post not found', 404, 'NOT_FOUND');

    if (existing.status === 'scheduled') {
      await cancelPost(req.params.id);
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw new Error(error.message);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/cancel — cancel a scheduled post
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !existing) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (existing.status !== 'scheduled') {
      throw new AppError('Only scheduled posts can be cancelled', 422, 'INVALID_STATUS');
    }

    await cancelPost(req.params.id);

    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select('id, status')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to cancel post');

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
