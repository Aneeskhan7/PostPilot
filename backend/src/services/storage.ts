// backend/src/services/storage.ts
import crypto from 'crypto';
import { supabase } from '../db/supabase';
import { AppError } from '../middleware/errorHandler';

const BUCKET = 'post-media';
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
};

export function validateFile(mimetype: string, size: number): string {
  const ext = ALLOWED_MIME[mimetype];
  if (!ext) {
    throw new AppError(
      `File type not allowed: ${mimetype}`,
      400,
      'INVALID_FILE_TYPE'
    );
  }
  if (size > MAX_BYTES) {
    throw new AppError('File exceeds 50MB limit', 400, 'FILE_TOO_LARGE');
  }
  return ext;
}

export async function uploadFile(
  userId: string,
  buffer: Buffer,
  mimetype: string,
  size: number
): Promise<string> {
  const ext = validateFile(mimetype, size);
  const filename = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw new AppError(`Upload failed: ${error.message}`, 502, 'UPLOAD_ERROR');

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteFile(publicUrl: string): Promise<void> {
  const url = new URL(publicUrl);
  // Extract path after /storage/v1/object/public/post-media/
  const prefix = `/storage/v1/object/public/${BUCKET}/`;
  const path = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : null;

  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error(`[STORAGE] Failed to delete ${path}: ${error.message}`);
}
