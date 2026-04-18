// frontend/src/hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as accountsApi from '../lib/api/accounts';

export function useAccounts() {
  const { getAccessToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: () => accountsApi.fetchAccounts(getAccessToken()!),
    enabled: !!getAccessToken(),
    staleTime: 1000 * 60,
  });
}

export function useToggleAccount() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      accountsApi.toggleAccount(getAccessToken()!, id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}

export function useDeleteAccount() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(getAccessToken()!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}
