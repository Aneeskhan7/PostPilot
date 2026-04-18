// frontend/src/lib/api/media.ts
import type { ApiResponse } from '../../types';

const API = import.meta.env.VITE_API_URL as string;

export async function uploadMedia(token: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API}/api/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error((body as { error?: string }).error ?? 'Upload failed');
  }

  const json = (await res.json()) as ApiResponse<{ url: string }>;
  return json.data.url;
}

export async function deleteMedia(token: string, url: string): Promise<void> {
  const res = await fetch(`${API}/api/media`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error((body as { error?: string }).error ?? 'Delete failed');
  }
}
