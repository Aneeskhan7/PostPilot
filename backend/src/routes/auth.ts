// backend/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { encrypt } from '../services/tokenManager';
import * as Meta from '../services/meta';
import * as LinkedIn from '../services/linkedin';

const router = Router();

// In-memory state store (process-scoped, sufficient for single-instance)
const oauthStates = new Map<string, { userId: string; expiresAt: number }>();

function generateState(userId: string): string {
  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });
  return state;
}

function consumeState(state: string): string {
  const entry = oauthStates.get(state);
  if (!entry || Date.now() > entry.expiresAt) {
    throw new AppError('Invalid or expired OAuth state', 400, 'INVALID_STATE');
  }
  oauthStates.delete(state);
  return entry.userId;
}

// ─── META (Facebook + Instagram) ───────────────────────────────────────────

// GET /auth/meta — redirect user to Facebook OAuth
router.get('/meta', requireAuth, (req: Request, res: Response) => {
  const state = generateState(req.user.id);
  res.redirect(Meta.getOAuthUrl(state));
});

// GET /auth/meta/callback — Facebook redirects here after user approves
router.get('/meta/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      throw new AppError(`Facebook OAuth denied: ${error}`, 400, 'OAUTH_DENIED');
    }

    if (!code || !state) {
      throw new AppError('Missing code or state', 400, 'INVALID_CALLBACK');
    }

    const userId = consumeState(state);

    // Exchange code → short-lived token → long-lived token
    const shortToken = await Meta.exchangeCodeForToken(code);
    const longLived = await Meta.getLongLivedToken(shortToken);
    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000).toISOString();

    // Fetch pages the user manages
    const pages = await Meta.getUserPages(longLived.access_token);

    if (pages.length === 0) {
      throw new AppError('No Facebook Pages found. You must manage at least one Page.', 422, 'NO_PAGES');
    }

    // Save each Facebook Page (and linked Instagram account) as a social_account
    for (const page of pages) {
      const encryptedPageToken = encrypt(page.access_token);

      // Upsert Facebook Page account
      const { error: fbError } = await supabase
        .from('social_accounts')
        .upsert({
          user_id: userId,
          platform: 'facebook',
          platform_account_id: page.id,
          platform_username: page.name,
          access_token: encryptedPageToken,
          token_expires_at: expiresAt,
          page_id: page.id,
          page_name: page.name,
          is_active: true,
        }, { onConflict: 'user_id,platform,platform_account_id' });

      if (fbError) throw new Error(fbError.message);

      // If this page has a linked Instagram Business Account, save it too
      if (page.instagram_business_account?.id) {
        try {
          const igAccount = await Meta.getInstagramAccount(
            page.instagram_business_account.id,
            page.access_token
          );

          const { error: igError } = await supabase
            .from('social_accounts')
            .upsert({
              user_id: userId,
              platform: 'instagram',
              platform_account_id: igAccount.id,
              platform_username: igAccount.username,
              platform_avatar_url: igAccount.profile_picture_url ?? null,
              access_token: encryptedPageToken,
              token_expires_at: expiresAt,
              page_id: page.id,
              page_name: page.name,
              is_active: true,
            }, { onConflict: 'user_id,platform,platform_account_id' });

          if (igError) throw new Error(igError.message);
        } catch {
          // Non-fatal: page may not have an IG account linked
          console.warn(`[META] No Instagram account for page ${page.id}`);
        }
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=meta`);
  } catch (err) {
    next(err);
  }
});

// ─── LINKEDIN ────────────────────────────────────────────────────────────────

// GET /auth/linkedin — redirect user to LinkedIn OAuth
router.get('/linkedin', requireAuth, (req: Request, res: Response) => {
  const state = generateState(req.user.id);
  res.redirect(LinkedIn.getOAuthUrl(state));
});

// GET /auth/linkedin/callback — LinkedIn redirects here after user approves
router.get('/linkedin/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      throw new AppError(`LinkedIn OAuth denied: ${error}`, 400, 'OAUTH_DENIED');
    }

    if (!code || !state) {
      throw new AppError('Missing code or state', 400, 'INVALID_CALLBACK');
    }

    const userId = consumeState(state);

    const tokenData = await LinkedIn.exchangeCodeForToken(code);
    const profile = await LinkedIn.getProfile(tokenData.access_token);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const encryptedToken = encrypt(tokenData.access_token);

    const { error: dbError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: userId,
        platform: 'linkedin',
        platform_account_id: profile.sub,
        platform_username: profile.name,
        platform_avatar_url: profile.picture ?? null,
        access_token: encryptedToken,
        token_expires_at: expiresAt,
        is_active: true,
      }, { onConflict: 'user_id,platform,platform_account_id' });

    if (dbError) throw new Error(dbError.message);

    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=linkedin`);
  } catch (err) {
    next(err);
  }
});

// ─── DISCONNECT ──────────────────────────────────────────────────────────────

// DELETE /auth/accounts/:id — disconnect a social account
router.delete('/accounts/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: account, error: findError } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !account) {
      throw new AppError('Account not found', 404, 'NOT_FOUND');
    }

    const { error: deleteError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(deleteError.message);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
