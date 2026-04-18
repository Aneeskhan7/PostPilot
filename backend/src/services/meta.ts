// backend/src/services/meta.ts
import { AppError } from '../middleware/errorHandler';

const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;
const REDIRECT_URI = process.env.META_REDIRECT_URI!;
const BASE_URL = 'https://graph.facebook.com/v21.0';
const TIMEOUT_MS = 10_000;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface LongLivedTokenResponse extends TokenResponse {
  expires_in: number;
}

interface PageAccount {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

interface PublishResult {
  id: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    console.log(`[META] ${options.method ?? 'GET'} ${url.split('?')[0]} → ${res.status} (${Date.now() - start}ms)`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function metaGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetchWithTimeout(url.toString());
  const json = await res.json() as { error?: { message: string } } & T;

  if (!res.ok || 'error' in json) {
    throw new AppError(
      (json as { error: { message: string } }).error?.message ?? 'Meta API error',
      res.status === 429 ? 429 : 502,
      res.status === 429 ? 'RATE_LIMITED' : 'META_API_ERROR'
    );
  }

  return json;
}

async function metaPost<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetchWithTimeout(url.toString(), { method: 'POST' });
  const json = await res.json() as { error?: { message: string } } & T;

  if (!res.ok || 'error' in json) {
    throw new AppError(
      (json as { error: { message: string } }).error?.message ?? 'Meta API error',
      res.status === 429 ? 429 : 502,
      res.status === 429 ? 'RATE_LIMITED' : 'META_API_ERROR'
    );
  }

  return json;
}

// Build the OAuth URL to redirect the user to Facebook login
export function getOAuthUrl(state: string): string {
  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  url.searchParams.set('client_id', APP_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'pages_show_list,pages_manage_posts,instagram_content_publish');
  return url.toString();
}

// Exchange the short-lived code for a short-lived user token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const data = await metaGet<TokenResponse>('/oauth/access_token', {
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code,
  });
  return data.access_token;
}

// Exchange short-lived token for a 60-day long-lived token
export async function getLongLivedToken(shortToken: string): Promise<LongLivedTokenResponse> {
  return metaGet<LongLivedTokenResponse>('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: shortToken,
  });
}

// Get all Facebook Pages the user manages
export async function getUserPages(userToken: string): Promise<PageAccount[]> {
  const data = await metaGet<{ data: PageAccount[] }>('/me/accounts', {
    access_token: userToken,
    fields: 'id,name,access_token,instagram_business_account',
  });
  return data.data;
}

// Get Instagram Business Account details linked to a Facebook Page
export async function getInstagramAccount(
  igAccountId: string,
  pageToken: string
): Promise<InstagramAccount> {
  return metaGet<InstagramAccount>(`/${igAccountId}`, {
    access_token: pageToken,
    fields: 'id,username,profile_picture_url',
  });
}

// Publish a photo post to a Facebook Page
export async function publishFacebookPost(
  pageId: string,
  pageToken: string,
  message: string,
  mediaUrls: string[]
): Promise<string> {
  const params: Record<string, string> = {
    access_token: pageToken,
    message,
  };

  if (mediaUrls.length > 0) {
    params['url'] = mediaUrls[0];
    const result = await metaPost<PublishResult>(`/${pageId}/photos`, params);
    return result.id;
  }

  const result = await metaPost<PublishResult>(`/${pageId}/feed`, params);
  return result.id;
}

// Step 1 of Instagram publish: create a media container
export async function createInstagramContainer(
  igAccountId: string,
  pageToken: string,
  caption: string,
  imageUrl: string
): Promise<string> {
  const result = await metaPost<PublishResult>(`/${igAccountId}/media`, {
    access_token: pageToken,
    image_url: imageUrl,
    caption,
  });
  return result.id;
}

// Step 2 of Instagram publish: publish the container
export async function publishInstagramContainer(
  igAccountId: string,
  pageToken: string,
  containerId: string
): Promise<string> {
  const result = await metaPost<PublishResult>(`/${igAccountId}/media_publish`, {
    access_token: pageToken,
    creation_id: containerId,
  });
  return result.id;
}

// Full Instagram publish flow (container → publish)
export async function publishInstagramPost(
  igAccountId: string,
  pageToken: string,
  caption: string,
  mediaUrls: string[]
): Promise<string> {
  if (mediaUrls.length === 0) {
    throw new AppError('Instagram requires at least one image', 400, 'VALIDATION_ERROR');
  }

  const containerId = await createInstagramContainer(igAccountId, pageToken, caption, mediaUrls[0]);

  // Instagram recommends a short wait before publishing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return publishInstagramContainer(igAccountId, pageToken, containerId);
}

// Verify a token is still valid and return basic user info
export async function verifyToken(accessToken: string): Promise<{ id: string; name: string }> {
  return metaGet<{ id: string; name: string }>('/me', {
    access_token: accessToken,
    fields: 'id,name',
  });
}
