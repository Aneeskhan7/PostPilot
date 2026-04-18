// frontend/src/lib/api/posts.ts
import type { Post, CreatePostInput, UpdatePostInput, ApiResponse } from '../../types';

const API = import.meta.env.VITE_API_URL as string;

async function authFetch(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((body as { error?: string }).error ?? 'Request failed');
  }

  return res;
}

export async function fetchPosts(token: string, status?: string): Promise<Post[]> {
  const url = new URL(`${API}/api/posts`);
  if (status) url.searchParams.set('status', status);
  const res = await authFetch(url.toString(), token);
  const json = (await res.json()) as ApiResponse<Post[]>;
  return json.data;
}

export async function fetchPost(token: string, id: string): Promise<Post> {
  const res = await authFetch(`${API}/api/posts/${id}`, token);
  const json = (await res.json()) as ApiResponse<Post>;
  return json.data;
}

export async function createPost(token: string, input: CreatePostInput): Promise<Post> {
  const res = await authFetch(`${API}/api/posts`, token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiResponse<Post>;
  return json.data;
}

export async function updatePost(token: string, id: string, input: UpdatePostInput): Promise<Post> {
  const res = await authFetch(`${API}/api/posts/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as ApiResponse<Post>;
  return json.data;
}

export async function deletePost(token: string, id: string): Promise<void> {
  await authFetch(`${API}/api/posts/${id}`, token, { method: 'DELETE' });
}

export async function cancelPost(token: string, id: string): Promise<Post> {
  const res = await authFetch(`${API}/api/posts/${id}/cancel`, token, { method: 'POST' });
  const json = (await res.json()) as ApiResponse<Post>;
  return json.data;
}
