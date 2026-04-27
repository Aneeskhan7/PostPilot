// frontend/src/hooks/useBilling.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { createCheckoutSession, createPortalSession, fetchSubscription, cancelSubscription } from '../lib/api/billing';
import { QUERY_KEYS } from '../lib/queryKeys';

const API = import.meta.env.VITE_API_URL as string;

function useToken() {
  return useAuthStore((s) => s.session?.access_token ?? null);
}

export function useSyncBilling() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!token) return;
      const res = await fetch(`${API}/api/billing/sync`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Billing sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}

export function useCreateCheckout() {
  const token = useToken();

  return useMutation({
    mutationFn: (priceId: string) => {
      if (!token) throw new Error('Not authenticated');
      return createCheckoutSession(token, priceId);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useCreatePortal() {
  const token = useToken();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Not authenticated');
      return createPortalSession(token);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useSubscription() {
  const token = useToken();

  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: () => fetchSubscription(token!),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useCancelSubscription() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Not authenticated');
      return cancelSubscription(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}
