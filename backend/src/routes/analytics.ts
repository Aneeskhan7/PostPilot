// backend/src/routes/analytics.ts
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/analytics/:postId — get analytics for a post
router.get('/:postId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ownership check
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', req.params.postId)
      .eq('user_id', req.user.id)
      .single();

    if (postError || !post) throw new AppError('Post not found', 404, 'NOT_FOUND');

    const { data, error } = await supabase
      .from('post_analytics')
      .select('id, platform, likes, comments, shares, reach, impressions, clicks, fetched_at')
      .eq('post_id', req.params.postId)
      .order('fetched_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics — summary stats for the authenticated user
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, status, platforms, created_at')
      .eq('user_id', req.user.id);

    if (postsError) throw new Error(postsError.message);

    const total     = posts?.length ?? 0;
    const published = posts?.filter((p) => p.status === 'published').length ?? 0;
    const scheduled = posts?.filter((p) => p.status === 'scheduled').length ?? 0;
    const failed    = posts?.filter((p) => p.status === 'failed').length ?? 0;

    const platformCounts: Record<string, number> = { instagram: 0, facebook: 0, linkedin: 0 };
    posts?.forEach((p) => {
      (p.platforms as string[]).forEach((platform) => {
        if (platform in platformCounts) platformCounts[platform]++;
      });
    });

    res.json({
      data: {
        total,
        published,
        scheduled,
        failed,
        platform_counts: platformCounts,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
