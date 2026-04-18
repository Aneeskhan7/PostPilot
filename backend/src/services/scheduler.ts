// backend/src/services/scheduler.ts
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { supabase } from '../db/supabase';

const QUEUE_NAME = 'post-publishing';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const publishQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[SCHEDULER] Job ${jobId} failed: ${failedReason}`);
});

// Schedule a post to be published at scheduledAt
export async function schedulePost(postId: string, scheduledAt: Date): Promise<string> {
  const delay = scheduledAt.getTime() - Date.now();

  if (delay < 0) {
    throw new Error(`Scheduled time is in the past for post ${postId}`);
  }

  const job = await publishQueue.add(
    'publish',
    { postId },
    {
      jobId: `post-${postId}`,
      delay,
    }
  );

  await supabase.from('scheduled_jobs').insert({
    post_id: postId,
    bullmq_job_id: job.id!,
    status: 'pending',
  });

  console.log(`[SCHEDULER] Post ${postId} scheduled in ${Math.round(delay / 1000)}s (job: ${job.id})`);
  return job.id!;
}

// Cancel a scheduled post job
export async function cancelPost(postId: string): Promise<void> {
  const job = await publishQueue.getJob(`post-${postId}`);

  if (job) {
    await job.remove();
    console.log(`[SCHEDULER] Cancelled job for post ${postId}`);
  }

  await supabase
    .from('scheduled_jobs')
    .update({ status: 'failed', last_error: 'Cancelled by user' })
    .eq('post_id', postId)
    .eq('status', 'pending');
}

// Reschedule a post (cancel existing job, create new one)
export async function reschedulePost(postId: string, newScheduledAt: Date): Promise<string> {
  await cancelPost(postId);
  return schedulePost(postId, newScheduledAt);
}

export { connection };
