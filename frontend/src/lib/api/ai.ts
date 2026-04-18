// frontend/src/lib/api/ai.ts
import type { ApiResponse } from '../../types';

const API = import.meta.env.VITE_API_URL as string;

interface GenerateInput {
  topic: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  tone: 'professional' | 'casual' | 'funny' | 'inspirational';
  includeHashtags: boolean;
}

interface ImproveInput {
  caption: string;
  platform: 'instagram' | 'facebook' | 'linkedin';
  instruction: string;
}

async function authPost<T>(url: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }
  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function generateCaption(token: string, input: GenerateInput): Promise<string> {
  const data = await authPost<{ caption: string }>(`${API}/api/ai/generate`, token, input);
  return data.caption;
}

export async function improveCaption(token: string, input: ImproveInput): Promise<string> {
  const data = await authPost<{ caption: string }>(`${API}/api/ai/improve`, token, input);
  return data.caption;
}
