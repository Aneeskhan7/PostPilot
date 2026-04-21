// frontend/src/hooks/useBilling.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { createCheckoutSession, createPortalSession, fetchSubscription, cancelSubscription } from '../lib/api/billing';
import { QUERY_KEYS } from '../lib/queryKeys';

const API = import.meta.env.VITE_API_URL as string;

export function useSyncBilling() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
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
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (priceId: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return createCheckoutSession(token, priceId);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useCreatePortal() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return createPortalSession(token);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useSubscription() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return fetchSubscription(token);
    },
    staleTime: 60_000,
  });
}

export function useCancelSubscription() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return cancelSubscription(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscription });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}
