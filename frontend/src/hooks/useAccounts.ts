// frontend/src/hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as accountsApi from '../lib/api/accounts';

function useToken() {
  return useAuthStore((s) => s.session?.access_token ?? null);
}

export function useAccounts() {
  const token = useToken();

  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: () => accountsApi.fetchAccounts(token!),
    enabled: !!token,
    staleTime: 5 * 60_000, // accounts change rarely — 5 min
  });
}

export function useToggleAccount() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!token) throw new Error('Not authenticated');
      return accountsApi.toggleAccount(token, id, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}

export function useDeleteAccount() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Not authenticated');
      return accountsApi.deleteAccount(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}
