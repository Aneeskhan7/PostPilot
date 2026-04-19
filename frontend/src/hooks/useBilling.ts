// frontend/src/hooks/useBilling.ts
import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { createCheckoutSession, createPortalSession } from '../lib/api/billing';

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
