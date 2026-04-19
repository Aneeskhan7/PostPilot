// frontend/src/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const { user, session, loading, signInWithEmail, signUpWithEmail, signOut } = useAuthStore();

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getAccessToken: () => session?.access_token ?? null,
    getToken: async (): Promise<string | null> => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  };
}
