// frontend/src/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import * as adminApi from '../lib/api/admin';
import type { Plan } from '../types';

export function useAdminStats() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return adminApi.fetchAdminStats(token);
    },
    staleTime: 30_000,
  });
}

export function useAdminUsers(page: number, limit = 20) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.adminUsers(page),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return adminApi.fetchAdminUsers(token, page, limit);
    },
    staleTime: 30_000,
  });
}

export function useAdminUser(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.adminUser(id),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return adminApi.fetchAdminUser(token, id);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useUpdateUserPlan() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: Plan }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return adminApi.updateUserPlan(token, id, plan);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUser(id) });
    },
  });
}
