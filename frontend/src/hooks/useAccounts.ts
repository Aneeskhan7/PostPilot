// frontend/src/hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as accountsApi from '../lib/api/accounts';

export function useAccounts() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return accountsApi.fetchAccounts(token);
    },
    staleTime: 1000 * 60,
  });
}

export function useToggleAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return accountsApi.toggleAccount(token, id, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}

export function useDeleteAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return accountsApi.deleteAccount(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}
