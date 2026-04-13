import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
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

interface AuthContextValue extends AuthState {
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'warehouse',
    displayName: '',
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }, []);

  const updateWithProfile = useCallback(async (session: Session) => {
    const profile = await fetchProfile(session.user.id);
    setState((prev) => ({
      ...prev,
      session,
      user: session.user,
      role: (profile?.role as Role) ?? 'warehouse',
      displayName: profile?.display_name ?? session.user.email ?? '',
      loading: false,
    }));
  }, [fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, session, user: session.user }));
        setTimeout(() => updateWithProfile(session), 0);
      } else {
        setState({ user: null, session: null, role: 'warehouse', displayName: '', loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateWithProfile(session);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [updateWithProfile]);

  const signIn = async (identifier: string, password: string) => {
    let email = identifier;
    // If not an email, look up by display_name
    if (!identifier.includes('@')) {
      const { data, error } = await supabase.rpc('lookup_email_by_name', { p_name: identifier });
      if (error || !data) throw new Error('未找到该姓名对应的账号');
      email = data as string;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string, role: Role) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
