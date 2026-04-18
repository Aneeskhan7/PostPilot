// backend/src/routes/accounts.ts
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/accounts — list all connected social accounts
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('id, platform, platform_account_id, platform_username, platform_avatar_url, page_id, page_name, is_active, token_expires_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// GET /api/accounts/:id — get a single account
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('id, platform, platform_account_id, platform_username, platform_avatar_url, page_id, page_name, is_active, token_expires_at, created_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) throw new AppError('Account not found', 404, 'NOT_FOUND');

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/accounts/:id — toggle is_active
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_active } = req.body as { is_active?: boolean };

    if (typeof is_active !== 'boolean') {
      throw new AppError('is_active must be a boolean', 400, 'VALIDATION_ERROR');
    }

    const { data: existing, error: findError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !existing) throw new AppError('Account not found', 404, 'NOT_FOUND');

    const { data, error } = await supabase
      .from('social_accounts')
      .update({ is_active })
      .eq('id', req.params.id)
      .select('id, platform, platform_username, is_active')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update account');

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/accounts/:id — disconnect a social account
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !existing) throw new AppError('Account not found', 404, 'NOT_FOUND');

    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw new Error(error.message);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
