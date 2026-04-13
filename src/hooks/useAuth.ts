import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Role } from '@/types/inventory';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: Role;
  displayName: string;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'warehouse',
    displayName: '',
    loading: true,
  });

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchProfile(session.user.id);
          setState((prev) => ({
            ...prev,
            role: (profile?.role as Role) ?? 'warehouse',
            displayName: profile?.display_name ?? session.user.email ?? '',
            loading: false,
          }));
        }, 0);
      } else {
        setState((prev) => ({ ...prev, loading: false, role: 'warehouse', displayName: '' }));
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, session, user: session.user }));
        fetchProfile(session.user.id).then((profile) => {
          setState((prev) => ({
            ...prev,
            role: (profile?.role as Role) ?? 'warehouse',
            displayName: profile?.display_name ?? session.user.email ?? '',
            loading: false,
          }));
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, role: Role) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signUp, signOut };
}
