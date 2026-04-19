// backend/src/workers/publishWorker.ts
import { Worker, Job } from 'bullmq';
import { supabase } from '../db/supabase';
import { connection } from '../services/scheduler';
import { decrypt } from '../services/tokenManager';
import * as Meta from '../services/meta';
import * as LinkedIn from '../services/linkedin';
import type { Platform } from '../db/types';

const QUEUE_NAME = 'post-publishing';

interface PublishJobData {
  postId: string;
}

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  platforms: Platform[];
  status: string;
}

interface SocialAccountRow {
  id: string;
  platform: Platform;
  platform_account_id: string;
  access_token: string;
  page_id: string | null;
}

async function fetchPost(postId: string): Promise<PostRow> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, user_id, content, media_urls, platforms, status')
    .eq('id', postId)
    .single();

  if (error || !data) throw new Error(`Post ${postId} not found: ${error?.message}`);
  return data;
}

async function fetchAccounts(userId: string, platforms: Platform[]): Promise<SocialAccountRow[]> {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('id, platform, platform_account_id, access_token, page_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('platform', platforms);

  if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
  return data ?? [];
}

async function setPostStatus(
  postId: string,
  status: 'publishing' | 'published' | 'failed',
  extra: { failure_reason?: string; published_at?: string; platform_post_ids?: Record<string, string> } = {}
): Promise<void> {
  await supabase
    .from('posts')
    .update({ status, ...extra })
    .eq('id', postId);
}

async function updateJobRecord(
  postId: string,
  status: 'active' | 'completed' | 'failed',
  attempts: number,
  lastError?: string
): Promise<void> {
  await supabase
    .from('scheduled_jobs')
    .update({ status, attempts, last_error: lastError ?? null })
    .eq('post_id', postId);
}

async function publishToFacebook(
  account: SocialAccountRow,
  content: string,
  mediaUrls: string[]
): Promise<string> {
  const pageToken = decrypt(account.access_token);
  const pageId = account.page_id ?? account.platform_account_id;
  return Meta.publishFacebookPost(pageId, pageToken, content, mediaUrls);
}

async function publishToInstagram(
  account: SocialAccountRow,
  content: string,
  mediaUrls: string[]
): Promise<string> {
  const pageToken = decrypt(account.access_token);
  return Meta.publishInstagramPost(account.platform_account_id, pageToken, content, mediaUrls);
}

async function publishToLinkedIn(
  account: SocialAccountRow,
  content: string,
  mediaUrls: string[]
): Promise<string> {
  const accessToken = decrypt(account.access_token);
  const personUrn = account.platform_account_id;

  if (mediaUrls.length === 0) {
    return LinkedIn.publishPost(personUrn, accessToken, content);
  }

  // Upload images to LinkedIn first, collect asset URNs
  const assetUrns: string[] = [];

  for (const imageUrl of mediaUrls) {
    const { uploadUrl, asset } = await LinkedIn.registerImageUpload(personUrn, accessToken);

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
    const buffer = Buffer.from(await imageRes.arrayBuffer());

    await LinkedIn.uploadImageBinary(uploadUrl, buffer, accessToken);
    assetUrns.push(asset);
  }

  return LinkedIn.publishPost(personUrn, accessToken, content, assetUrns);
}

async function processJob(job: Job<PublishJobData>): Promise<void> {
  const { postId } = job.data;
  console.log(`[WORKER] Starting job ${job.id} for post ${postId}`);

  const post = await fetchPost(postId);

  if (post.status !== 'scheduled') {
    console.warn(`[WORKER] Post ${postId} is not scheduled (status: ${post.status}), skipping`);
    return;
  }

  await setPostStatus(postId, 'publishing');
  await updateJobRecord(postId, 'active', job.attemptsMade);

  const accounts = await fetchAccounts(post.user_id, post.platforms);
  const platformPostIds: Record<string, string> = {};
  const errors: string[] = [];

  for (const platform of post.platforms) {
    const account = accounts.find((a) => a.platform === platform);

    if (!account) {
      errors.push(`No active ${platform} account found`);
      console.error(`[WORKER] No ${platform} account for user ${post.user_id}`);
      continue;
    }

    try {
      let postId: string;

      if (platform === 'facebook') {
        postId = await publishToFacebook(account, post.content, post.media_urls);
      } else if (platform === 'instagram') {
        postId = await publishToInstagram(account, post.content, post.media_urls);
      } else {
        postId = await publishToLinkedIn(account, post.content, post.media_urls);
      }

      platformPostIds[platform] = postId;
      console.log(`[WORKER] Published to ${platform}: ${postId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${platform}: ${msg}`);
      console.error(`[WORKER] Failed to publish to ${platform}: ${msg}`);
    }
  }

  if (errors.length === post.platforms.length) {
    // All platforms failed
    await setPostStatus(post.id, 'failed', { failure_reason: errors.join('; ') });
    await updateJobRecord(post.id, 'failed', job.attemptsMade + 1, errors.join('; '));
    throw new Error(errors.join('; '));
  }

  // At least one platform succeeded
  await setPostStatus(post.id, 'published', {
    published_at: new Date().toISOString(),
    platform_post_ids: platformPostIds,
  });
  await updateJobRecord(post.id, 'completed', job.attemptsMade + 1);

  await supabase.rpc('increment_post_counts', { user_id_input: post.user_id });

  console.log(`[WORKER] Post ${post.id} published successfully`);
}

export function startWorker(): Worker<PublishJobData> {
  const worker = new Worker<PublishJobData>(QUEUE_NAME, processJob, {
    connection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    console.log(`[WORKER] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WORKER] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[WORKER] Worker error:', err);
  });

  console.log('[WORKER] Publish worker started');
  return worker;
}
