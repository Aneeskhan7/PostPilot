// backend/src/routes/accounts.ts
import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { cache } from '../services/memCache';

const router = Router();

// GET /api/accounts — list all connected social accounts
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = `accounts:${req.user.id}`;

    // Check cache first
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return res.json({ data: cached });
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .select('id, platform, platform_account_id, platform_username, platform_avatar_url, page_id, page_name, is_active, token_expires_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Cache for 30 seconds
    cache.set(cacheKey, data, 30_000);

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

    // Invalidate cache after successful update
    cache.del(`accounts:${req.user.id}`);

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

    // Invalidate cache after successful delete
    cache.del(`accounts:${req.user.id}`);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// GET /api/accounts/debug/instagram — shows raw Meta API response for Instagram detection
router.get('/debug/instagram', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: fbAccount, error: fbErr } = await supabase
      .from('social_accounts')
      .select('access_token, platform_username')
      .eq('user_id', req.user.id)
      .eq('platform', 'facebook')
      .is('page_id', null)
      .single();

    if (fbErr || !fbAccount) {
      res.json({ error: 'No Facebook personal account found. Connect Facebook first.' });
      return;
    }

    const { decrypt } = await import('../services/tokenManager');
    const token = decrypt(fbAccount.access_token);

    // Fetch pages with all Instagram fields
    const pagesUrl = new URL('https://graph.facebook.com/v21.0/me/accounts');
    pagesUrl.searchParams.set('access_token', token);
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username,profile_picture_url},connected_instagram_account{id,username,profile_picture_url},instagram_accounts{id,username,profile_picture_url}');

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson = await pagesRes.json();

    // Fetch direct Instagram accounts
    const igUrl = new URL('https://graph.facebook.com/v21.0/me/instagram_accounts');
    igUrl.searchParams.set('access_token', token);
    igUrl.searchParams.set('fields', 'id,username,profile_picture_url');

    const igRes = await fetch(igUrl.toString());
    const igJson = await igRes.json();

    // Fetch token debug info (scopes granted)
    const debugUrl = new URL('https://graph.facebook.com/v21.0/debug_token');
    debugUrl.searchParams.set('input_token', token);
    debugUrl.searchParams.set('access_token', token);
    const debugRes = await fetch(debugUrl.toString());
    const debugJson = await debugRes.json();

    res.json({
      facebook_username: fbAccount.platform_username,
      pages: pagesJson,
      instagram_accounts: igJson,
      token_debug: debugJson,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
