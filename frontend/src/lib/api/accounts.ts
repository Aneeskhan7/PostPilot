// frontend/src/lib/api/accounts.ts
import type { SocialAccount, ApiResponse } from '../../types';

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

export async function fetchAccounts(token: string): Promise<SocialAccount[]> {
  const res = await authFetch(`${API}/api/accounts`, token);
  const json = (await res.json()) as ApiResponse<SocialAccount[]>;
  return json.data;
}

export async function toggleAccount(token: string, id: string, isActive: boolean): Promise<SocialAccount> {
  const res = await authFetch(`${API}/api/accounts/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
  const json = (await res.json()) as ApiResponse<SocialAccount>;
  return json.data;
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await authFetch(`${API}/api/accounts/${id}`, token, { method: 'DELETE' });
}
