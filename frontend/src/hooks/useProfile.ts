// frontend/src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { QUERY_KEYS } from '../lib/queryKeys';
import type { Profile } from '../types';

export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, plan, monthly_post_count, monthly_reset_at, daily_post_count, daily_reset_at, is_admin')
        .eq('id', user!.id)
        .single();

      if (error || !data) throw new Error(error?.message ?? 'Profile not found');
      return data as Profile;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
