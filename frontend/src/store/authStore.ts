// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  setSession: (session: Session | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<() => void>;
}

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return (data as { is_admin?: boolean } | null)?.is_admin ?? false;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, loading: false }),

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  signUpWithEmail: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAdmin: false });
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    const isAdmin = user ? await fetchIsAdmin(user.id) : false;

    set({
      session: data.session,
      user,
      isAdmin,
      loading: false,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;
        const newIsAdmin = newUser ? await fetchIsAdmin(newUser.id) : false;
        set({ session, user: newUser, isAdmin: newIsAdmin, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  },
}));
