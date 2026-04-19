// frontend/src/lib/api/billing.ts
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

export async function createCheckoutSession(token: string, priceId: string): Promise<string> {
  const res = await authFetch(`${API}/api/billing/checkout`, token, {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
  const json = (await res.json()) as { data: { url: string } };
  return json.data.url;
}

export async function createPortalSession(token: string): Promise<string> {
  const res = await authFetch(`${API}/api/billing/portal`, token, {
    method: 'POST',
  });
  const json = (await res.json()) as { data: { url: string } };
  return json.data.url;
}
