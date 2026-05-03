import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Profile = {
  id: string;
  username: string;
  is_admin: boolean;
};

type AuthContextValue = {
  ready: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const isConfigured = supabase !== null;
  const userId = session?.user?.id;

  // Pull the latest profile row. Exposed via context so anything that
  // changes the row (admin grants, edit-profile saves) can refresh it
  // immediately without forcing a re-login.
  const refreshProfile = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', userId)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, [userId]);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Initial profile load + reload whenever the user changes.
  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  // Realtime: react to changes on the user's own profile row so admin
  // grants/revokes propagate the moment they happen — no logout needed,
  // no waiting for the next navigation. Best-effort: requires Realtime
  // to be enabled on the `profiles` table in the Supabase dashboard.
  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          void refreshProfile();
        },
      )
      .subscribe();
    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [userId, refreshProfile]);

  // Fallback: refresh when the tab regains focus. Catches the case
  // where Realtime isn't enabled and the user changed in another tab
  // / on another device while this tab was idle.
  useEffect(() => {
    if (!supabase || !userId) return;
    const onFocus = () => {
      void refreshProfile();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, refreshProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        if (/Username already taken/i.test(error.message)) {
          throw new Error('That username is already taken — try another.');
        }
        if (/Invalid username format/i.test(error.message)) {
          throw new Error('Username must be 3–32 characters: letters, numbers, underscore.');
        }
        throw error;
      }
    },
    [],
  );

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user: session?.user ?? null,
      session,
      profile,
      isAdmin: profile?.is_admin ?? false,
      isConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      refreshProfile,
    }),
    [
      ready,
      session,
      profile,
      isConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
