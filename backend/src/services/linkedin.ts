// backend/src/services/linkedin.ts
import { AppError } from '../middleware/errorHandler';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;
const BASE_URL = 'https://api.linkedin.com/v2';
const TIMEOUT_MS = 10_000;

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
}

interface ImageUploadResponse {
  value: {
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
        uploadUrl: string;
      };
    };
    asset: string;
  };
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
    console.log(`[LINKEDIN] ${options.method ?? 'GET'} ${url.split('?')[0]} → ${res.status} (${Date.now() - start}ms)`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function linkedInRequest<T>(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown
): Promise<T> {
  const res = await fetchWithTimeout(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return {} as T;

  const json = await res.json() as { message?: string; status?: number } & T;

  if (!res.ok) {
    throw new AppError(
      (json as { message?: string }).message ?? 'LinkedIn API error',
      res.status === 429 ? 429 : 502,
      res.status === 429 ? 'RATE_LIMITED' : 'LINKEDIN_API_ERROR'
    );
  }

  return json;
}

// Build the OAuth URL to redirect the user to LinkedIn login
export function getOAuthUrl(state: string): string {
  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'openid profile email w_member_social');
  return url.toString();
}

// Exchange the auth code for an access token
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetchWithTimeout('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const json = await res.json() as { error?: string; error_description?: string } & TokenResponse;

  if (!res.ok || json.error) {
    throw new AppError(
      json.error_description ?? 'Failed to exchange LinkedIn token',
      502,
      'LINKEDIN_AUTH_ERROR'
    );
  }

  return json;
}

// Get the authenticated user's LinkedIn profile
export async function getProfile(accessToken: string): Promise<LinkedInProfile> {
  const res = await fetchWithTimeout('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const json = await res.json() as { message?: string } & LinkedInProfile;

  if (!res.ok) {
    throw new AppError(
      json.message ?? 'Failed to fetch LinkedIn profile',
      502,
      'LINKEDIN_API_ERROR'
    );
  }

  return json;
}

// Step 1: Register an image upload with LinkedIn, get an upload URL + asset URN
export async function registerImageUpload(
  personUrn: string,
  accessToken: string
): Promise<{ uploadUrl: string; asset: string }> {
  const body = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: `urn:li:person:${personUrn}`,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        },
      ],
    },
  };

  const data = await linkedInRequest<ImageUploadResponse>(
    'POST',
    `${BASE_URL}/assets?action=registerUpload`,
    accessToken,
    body
  );

  const uploadUrl =
    data.value.uploadMechanism[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ].uploadUrl;

  return { uploadUrl, asset: data.value.asset };
}

// Step 2: Upload the image binary to the LinkedIn upload URL
export async function uploadImageBinary(
  uploadUrl: string,
  imageBuffer: Buffer,
  accessToken: string
): Promise<void> {
  const res = await fetchWithTimeout(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!res.ok) {
    throw new AppError('Failed to upload image to LinkedIn', 502, 'LINKEDIN_UPLOAD_ERROR');
  }
}

// Publish a text or image post to LinkedIn
export async function publishPost(
  personUrn: string,
  accessToken: string,
  text: string,
  assetUrns: string[] = []
): Promise<string> {
  const media = assetUrns.map((asset) => ({
    status: 'READY',
    description: { text: '' },
    media: asset,
    title: { text: '' },
  }));

  const body = {
    author: `urn:li:person:${personUrn}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: assetUrns.length > 0 ? 'IMAGE' : 'NONE',
        ...(assetUrns.length > 0 && { media }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetchWithTimeout(`${BASE_URL}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json() as { message?: string } & PublishResult;

  if (!res.ok) {
    throw new AppError(
      json.message ?? 'Failed to publish LinkedIn post',
      res.status === 429 ? 429 : 502,
      res.status === 429 ? 'RATE_LIMITED' : 'LINKEDIN_API_ERROR'
    );
  }

  return json.id;
}
