// backend/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { encrypt } from '../services/tokenManager';
import { cache } from '../services/memCache';
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

// Resolves user ID from Authorization header OR ?token= query param
async function resolveUserId(req: Request): Promise<string> {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.query.token as string | undefined);

  if (!token) throw new AppError('Missing authorization', 401, 'UNAUTHORIZED');

  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  return data.user.id;
}

// ─── META (Facebook + Instagram) ───────────────────────────────────────────

// Guarantees a profiles row exists for userId before touching social_accounts.
// Users who signed up before the trigger was deployed won't have one.
async function ensureProfile(userId: string): Promise<void> {
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const user = authUser?.user;
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email: user?.email ?? '',
    full_name: user?.user_metadata?.full_name ?? null,
    avatar_url: user?.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id' });
  if (error) throw new Error(`Profile sync failed: ${error.message}`);
}

function oauthError(res: Response, message: string): void {
  const url = new URL(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/settings`);
  url.searchParams.set('error', message);
  res.redirect(url.toString());
}

// GET /auth/meta — redirect user to Facebook OAuth
// Accepts token via Authorization header OR ?token= query param (browser redirect)
router.get('/meta', async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req);
    const state = generateState(userId);
    res.redirect(Meta.getOAuthUrl(state));
  } catch (err) {
    oauthError(res, err instanceof Error ? err.message : 'Could not start Meta OAuth');
  }
});

// GET /auth/meta/callback — Facebook redirects here after user approves
router.get('/meta/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      return oauthError(res, `Facebook OAuth denied: ${error}`);
    }

    if (!code || !state) {
      return oauthError(res, 'Missing code or state');
    }

    const userId = consumeState(state);
    try {
      await ensureProfile(userId);
    } catch (profileErr) {
      console.error('[AUTH] ensureProfile failed (non-fatal):', profileErr instanceof Error ? profileErr.message : profileErr);
    }

    // Exchange code → short-lived token → long-lived token
    const shortToken = await Meta.exchangeCodeForToken(code);
    const longLived = await Meta.getLongLivedToken(shortToken);
    const expiresAt = new Date(Date.now() + (longLived.expires_in ?? 5184000) * 1000).toISOString();
    const encryptedUserToken = encrypt(longLived.access_token);

    // Always save the personal Facebook profile
    const fbProfile = await Meta.getPersonalProfile(longLived.access_token);
    const { error: personalErr } = await supabase.from('social_accounts').upsert({
      user_id: userId,
      platform: 'facebook',
      platform_account_id: fbProfile.id,
      platform_username: fbProfile.name,
      platform_avatar_url: fbProfile.picture?.data?.url ?? null,
      access_token: encryptedUserToken,
      token_expires_at: expiresAt,
      page_id: null,
      page_name: null,
      is_active: true,
    }, { onConflict: 'user_id,platform,platform_account_id' });
    if (personalErr) throw new Error(personalErr.message);

    // Save any Facebook Pages and their linked Instagram Business Accounts
    const pages = await Meta.getUserPages(longLived.access_token);
    console.log(`[META] FULL PAGES RESPONSE:`, JSON.stringify(pages, null, 2));

    await Promise.all(pages.map(async (page) => {
      try {
        const encryptedPageToken = encrypt(page.access_token);

        const { error: fbErr } = await supabase.from('social_accounts').upsert({
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
        if (fbErr) throw new Error(fbErr.message);

        // Try to save Instagram — check nested data first, then fetch, then page fallback
        let igSaved = false;

        // First try instagram_business_account
        if (page.instagram_business_account?.id) {
          try {
            const nested = page.instagram_business_account;
            const igAccount = nested.username
              ? nested as { id: string; username: string; profile_picture_url?: string }
              : await Meta.getInstagramAccount(nested.id, page.access_token);
            await supabase.from('social_accounts').upsert({
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
            igSaved = true;
            console.log(`[META] Saved Instagram account ${igAccount.username} via business account`);
          } catch (e) {
            console.warn(`[META] instagram_business_account fetch failed for page ${page.id}:`, e instanceof Error ? e.message : e);
          }
        }

        // Try connected_instagram_account (for Creator accounts)
        if (!igSaved && page.connected_instagram_account?.id) {
          try {
            const nested = page.connected_instagram_account;
            const igAccount = nested.username
              ? nested as { id: string; username: string; profile_picture_url?: string }
              : await Meta.getInstagramAccount(nested.id, page.access_token);
            await supabase.from('social_accounts').upsert({
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
            igSaved = true;
            console.log(`[META] Saved Instagram account ${igAccount.username} via connected account (Creator)`);
          } catch (e) {
            console.warn(`[META] connected_instagram_account fetch failed for page ${page.id}:`, e instanceof Error ? e.message : e);
          }
        }

        // Try instagram_accounts array
        if (!igSaved && page.instagram_accounts?.data?.length) {
          try {
            for (const igAcc of page.instagram_accounts.data) {
              const igAccount = igAcc.username
                ? igAcc as { id: string; username: string; profile_picture_url?: string }
                : await Meta.getInstagramAccount(igAcc.id, page.access_token);
              await supabase.from('social_accounts').upsert({
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
              igSaved = true;
              console.log(`[META] Saved Instagram account ${igAccount.username} via instagram_accounts array`);
              break; // Only save the first one
            }
          } catch (e) {
            console.warn(`[META] instagram_accounts array fetch failed for page ${page.id}:`, e instanceof Error ? e.message : e);
          }
        }

        if (!igSaved) {
          // Fallback 1: /{page-id}/instagram_accounts edge
          const pageIgAccounts = await Meta.getPageInstagramAccounts(page.id, page.access_token);
          for (const igAcc of pageIgAccounts) {
            await supabase.from('social_accounts').upsert({
              user_id: userId,
              platform: 'instagram',
              platform_account_id: igAcc.id,
              platform_username: igAcc.username,
              platform_avatar_url: igAcc.profile_picture_url ?? null,
              access_token: encryptedPageToken,
              token_expires_at: expiresAt,
              page_id: page.id,
              page_name: page.name,
              is_active: true,
            }, { onConflict: 'user_id,platform,platform_account_id' });
            console.log(`[META] Saved Instagram via page instagram_accounts: ${igAcc.username}`);
            igSaved = true;
          }
        }

        if (!igSaved) {
          // Fallback 2: query /{page-id} directly with page token
          const pageData = await Meta.getPageWithInstagram(page.id, page.access_token);

          // Check both business and connected account fields
          const igAcc = pageData.instagram_business_account || pageData.connected_instagram_account;
          if (igAcc?.id) {
            const igProfile = igAcc.username
              ? igAcc as { id: string; username: string; profile_picture_url?: string }
              : await Meta.getInstagramAccount(igAcc.id, page.access_token);
            await supabase.from('social_accounts').upsert({
              user_id: userId,
              platform: 'instagram',
              platform_account_id: igProfile.id,
              platform_username: igProfile.username,
              platform_avatar_url: igProfile.profile_picture_url ?? null,
              access_token: encryptedPageToken,
              token_expires_at: expiresAt,
              page_id: page.id,
              page_name: page.name,
              is_active: true,
            }, { onConflict: 'user_id,platform,platform_account_id' });
            const accountType = pageData.instagram_business_account ? 'business' : 'connected';
            console.log(`[META] Saved Instagram via direct page query (${accountType}): ${igProfile.username}`);
            igSaved = true;
          }
        }

        if (!igSaved) {
          console.warn(`[META] Could not find Instagram for page ${page.id} — account may not be Professional type`);
        }
      } catch (pageError) {
        // Don't let one page failure cancel others
        console.error(`[META] Failed to process page ${page.id}:`, pageError instanceof Error ? pageError.message : pageError);
      }
    }));

    // Fallback A: /me/instagram_accounts edge
    const igAccounts = await Meta.getUserInstagramAccounts(longLived.access_token);
    for (const igAcc of igAccounts) {
      const { error: igDirectErr } = await supabase.from('social_accounts').upsert({
        user_id: userId,
        platform: 'instagram',
        platform_account_id: igAcc.id,
        platform_username: igAcc.username,
        platform_avatar_url: igAcc.profile_picture_url ?? null,
        access_token: encryptedUserToken,
        token_expires_at: expiresAt,
        page_id: null,
        page_name: null,
        is_active: true,
      }, { onConflict: 'user_id,platform,platform_account_id' });
      if (igDirectErr) console.warn('[META] Failed to save IG account (edge):', igDirectErr.message);
    }

    // Fallback B: use granular scopes from /debug_token to find IDs directly
    // Handles Business Manager pages where /me/accounts returns empty
    if (pages.length === 0) {
      console.log('[META] /me/accounts empty — querying via granular scopes');
      const { pageIds, instagramIds } = await Meta.getTokenGranularScopes(longLived.access_token);

      // Save Instagram accounts directly (user token has instagram_content_publish for these IDs)
      for (const igId of instagramIds) {
        try {
          const igAccount = await Meta.getInstagramAccount(igId, longLived.access_token);
          const { error: igErr } = await supabase.from('social_accounts').upsert({
            user_id: userId,
            platform: 'instagram',
            platform_account_id: igAccount.id,
            platform_username: igAccount.username,
            platform_avatar_url: igAccount.profile_picture_url ?? null,
            access_token: encryptedUserToken,
            token_expires_at: expiresAt,
            page_id: null,
            page_name: null,
            is_active: true,
          }, { onConflict: 'user_id,platform,platform_account_id' });
          if (igErr) console.warn('[META] Failed to save IG via scope:', igErr.message);
          else console.log('[META] Saved Instagram via granular scope:', igAccount.username);
        } catch (e) {
          console.warn('[META] Direct IG query failed for', igId, ':', e instanceof Error ? e.message : e);
        }
      }

      // Query each page directly and save with its Instagram connection
      for (const pageId of pageIds) {
        try {
          const pageData = await Meta.getPageById(pageId, longLived.access_token);
          if (!pageData) continue;

          const pageToken = pageData.access_token ?? longLived.access_token;
          const encryptedPageToken = encrypt(pageToken);

          await supabase.from('social_accounts').upsert({
            user_id: userId,
            platform: 'facebook',
            platform_account_id: pageData.id,
            platform_username: pageData.name,
            access_token: encryptedPageToken,
            token_expires_at: expiresAt,
            page_id: pageData.id,
            page_name: pageData.name,
            is_active: true,
          }, { onConflict: 'user_id,platform,platform_account_id' });
          console.log('[META] Saved Facebook page via direct query:', pageData.name);

          // Collect Instagram sources: page fields + instagram_accounts edge
          const edgeAccounts = await Meta.getPageInstagramAccounts(pageData.id, pageToken);
          const igCandidates = [
            pageData.instagram_business_account,
            pageData.connected_instagram_account,
            ...edgeAccounts,
          ].filter((a): a is { id: string; username?: string; profile_picture_url?: string } => !!a?.id);

          for (const igData of igCandidates) {
            try {
              const igProfile = igData.username
                ? (igData as { id: string; username: string; profile_picture_url?: string })
                : await Meta.getInstagramAccount(igData.id, pageToken);
              await supabase.from('social_accounts').upsert({
                user_id: userId,
                platform: 'instagram',
                platform_account_id: igProfile.id,
                platform_username: igProfile.username,
                platform_avatar_url: igProfile.profile_picture_url ?? null,
                access_token: encryptedPageToken,
                token_expires_at: expiresAt,
                page_id: pageData.id,
                page_name: pageData.name,
                is_active: true,
              }, { onConflict: 'user_id,platform,platform_account_id' });
              console.log('[META] Saved Instagram via direct page query:', igProfile.username);
              break;
            } catch (igErr) {
              console.warn('[META] Page IG candidate failed:', igData.id, igErr instanceof Error ? igErr.message : igErr);
            }
          }
        } catch (e) {
          console.warn('[META] Direct page query failed for', pageId, ':', e instanceof Error ? e.message : e);
        }
      }
    }

    // Invalidate accounts cache so fresh data is fetched after OAuth
    cache.del(`accounts:${userId}`);

    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=meta`);
  } catch (err) {
    oauthError(res, err instanceof Error ? err.message : 'Meta connection failed');
  }
});

// ─── LINKEDIN ────────────────────────────────────────────────────────────────

// GET /auth/linkedin — redirect user to LinkedIn OAuth
router.get('/linkedin', async (req: Request, res: Response) => {
  try {
    const userId = await resolveUserId(req);
    const state = generateState(userId);
    res.redirect(LinkedIn.getOAuthUrl(state));
  } catch (err) {
    oauthError(res, err instanceof Error ? err.message : 'Could not start LinkedIn OAuth');
  }
});

// GET /auth/linkedin/callback — LinkedIn redirects here after user approves
router.get('/linkedin/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      return oauthError(res, `LinkedIn OAuth denied: ${error}`);
    }

    if (!code || !state) {
      return oauthError(res, 'Missing code or state');
    }

    const userId = consumeState(state);
    try {
      await ensureProfile(userId);
    } catch (profileErr) {
      console.error('[AUTH] ensureProfile failed (non-fatal):', profileErr instanceof Error ? profileErr.message : profileErr);
    }

    const tokenData = await LinkedIn.exchangeCodeForToken(code);
    const profile = await LinkedIn.getProfile(tokenData.access_token);

    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 5184000) * 1000).toISOString();
    const encryptedToken = encrypt(tokenData.access_token);

    // Save personal LinkedIn profile
    const { error: dbError } = await supabase.from('social_accounts').upsert({
      user_id: userId,
      platform: 'linkedin',
      platform_account_id: profile.sub,
      platform_username: profile.name,
      platform_avatar_url: profile.picture ?? null,
      access_token: encryptedToken,
      token_expires_at: expiresAt,
      page_id: null,
      page_name: null,
      is_active: true,
    }, { onConflict: 'user_id,platform,platform_account_id' });
    if (dbError) throw new Error(dbError.message);

    // Save any LinkedIn Company Pages the user admins (non-fatal if scope not granted)
    const companyPages = await LinkedIn.getAdminOrganizations(tokenData.access_token);
    for (const org of companyPages) {
      const { error: orgErr } = await supabase.from('social_accounts').upsert({
        user_id: userId,
        platform: 'linkedin',
        platform_account_id: `org_${org.id}`,
        platform_username: org.name,
        platform_avatar_url: null,
        access_token: encryptedToken,
        token_expires_at: expiresAt,
        page_id: org.id,
        page_name: org.name,
        is_active: true,
      }, { onConflict: 'user_id,platform,platform_account_id' });
      if (orgErr) console.warn(`[LINKEDIN] Failed to save org ${org.id}: ${orgErr.message}`);
    }

    // Invalidate accounts cache so fresh data is fetched after OAuth
    cache.del(`accounts:${userId}`);

    res.redirect(`${process.env.FRONTEND_URL}/settings?connected=linkedin`);
  } catch (err) {
    oauthError(res, err instanceof Error ? err.message : 'LinkedIn connection failed');
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

    // Invalidate accounts cache after successful delete
    cache.del(`accounts:${req.user.id}`);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
