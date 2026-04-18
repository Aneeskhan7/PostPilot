// frontend/src/hooks/useAuth.ts
import { useAuthStore } from '../store/authStore';

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
  };
}
