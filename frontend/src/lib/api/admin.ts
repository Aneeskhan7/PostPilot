// frontend/src/lib/api/admin.ts
import type { AdminStats, AdminUserSummary, AdminUserDetail, Plan } from '../../types';

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

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await authFetch(`${API}/api/admin/stats`, token);
  const json = (await res.json()) as { data: AdminStats };
  return json.data;
}

export async function fetchAdminUsers(
  token: string,
  page: number,
  limit: number
): Promise<{ data: AdminUserSummary[]; total: number }> {
  const url = new URL(`${API}/api/admin/users`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  const res = await authFetch(url.toString(), token);
  return res.json() as Promise<{ data: AdminUserSummary[]; total: number }>;
}

export async function fetchAdminUser(token: string, id: string): Promise<AdminUserDetail> {
  const res = await authFetch(`${API}/api/admin/users/${id}`, token);
  const json = (await res.json()) as { data: AdminUserDetail };
  return json.data;
}

export async function updateUserPlan(token: string, id: string, plan: Plan): Promise<void> {
  await authFetch(`${API}/api/admin/users/${id}/plan`, token, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}
