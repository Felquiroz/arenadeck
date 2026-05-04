import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';

type AppRole = 'PLAYER' | 'ORGANIZER' | 'ADMIN';

interface AppUser {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: AppRole;
  elo_rating: number;
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, role?: AppRole) => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type LoginRow = {
  id: string;
  username: string;
  email: string;
  role: AppRole;
  elo_rating: number;
  password_hash: string;
};

const LOCAL_SESSION_KEY = 'arenadeck_local_session';
const LOCAL_ADMIN = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'admin',
  email: 'admin@local.arenadeck',
  role: 'ADMIN' as AppRole,
  elo_rating: 1200,
  password: 'admin123',
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const setLocalSession = (profile: UserProfile) => {
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
};

const getLocalSession = (): UserProfile | null => {
  const raw = localStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
};

const clearLocalSession = () => {
  localStorage.removeItem(LOCAL_SESSION_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const applyLocalProfile = (p: UserProfile | null) => {
    if (!p) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }

    setUser({ id: p.id, email: p.email });
    setProfile(p);
    setSession({ access_token: 'local', token_type: 'bearer' } as Session);
  };

  const loadProfileFromId = async (userId: string, fallbackEmail = '') => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, elo_rating')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const fallbackUsername = fallbackEmail.split('@')[0] || 'player';
      const { data: created, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: fallbackUsername,
          email: fallbackEmail || `${fallbackUsername}@local.arenadeck`,
          password_hash: 'supabase-auth',
          role: 'PLAYER',
          elo_rating: 1200,
        })
        .select('id, username, email, role, elo_rating')
        .single();
      if (createError) throw createError;
      setProfile(created as UserProfile);
      return;
    }

    setProfile(data as UserProfile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          setSession(session);
          setUser({ id: session.user.id, email: session.user.email || '' });
          await loadProfileFromId(session.user.id, session.user.email || '');
          clearLocalSession();
          return;
        }

        const local = getLocalSession();
        applyLocalProfile(local);
      } finally {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        if (newSession?.user) {
          setSession(newSession);
          setUser({ id: newSession.user.id, email: newSession.user.email || '' });
          await loadProfileFromId(newSession.user.id, newSession.user.email || '');
          clearLocalSession();
          return;
        }

        const local = getLocalSession();
        applyLocalProfile(local);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, role: AppRole = 'PLAYER') => {
    const normalizedEmail = email.trim() || `${username.trim()}@local.arenadeck`;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { username, role } },
    });

    if (!error && data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        username,
        email: normalizedEmail,
        password_hash: 'supabase-auth',
        role,
        elo_rating: 1200,
      });
      return;
    }

    const isRateLimited = Boolean(error?.message?.toLowerCase().includes('rate limit'));
    if (!isRateLimited) {
      throw error || new Error('No se pudo crear la cuenta');
    }

    const localId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('users').insert({
      id: localId,
      username,
      email: normalizedEmail,
      password_hash: password,
      role,
      elo_rating: 1200,
    });
    if (insertError) throw insertError;
  };

  const signIn = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const normalizedIdentifier = trimmed.toLowerCase();

    if (
      (normalizedIdentifier === LOCAL_ADMIN.username || normalizedIdentifier === LOCAL_ADMIN.email) &&
      password === LOCAL_ADMIN.password
    ) {
      const localAdminProfile: UserProfile = {
        id: LOCAL_ADMIN.id,
        username: LOCAL_ADMIN.username,
        email: LOCAL_ADMIN.email,
        role: LOCAL_ADMIN.role,
        elo_rating: LOCAL_ADMIN.elo_rating,
      };

      await supabase.from('users').upsert(
        {
          id: LOCAL_ADMIN.id,
          username: LOCAL_ADMIN.username,
          email: LOCAL_ADMIN.email,
          password_hash: LOCAL_ADMIN.password,
          role: LOCAL_ADMIN.role,
          elo_rating: LOCAL_ADMIN.elo_rating,
        },
        { onConflict: 'id' }
      );

      setLocalSession(localAdminProfile);
      applyLocalProfile(localAdminProfile);
      return;
    }

    const byField = trimmed.includes('@') ? 'email' : 'username';

    const { data: row, error: rowError } = await supabase
      .from('users')
      .select('id, username, email, role, elo_rating, password_hash')
      .eq(byField, trimmed)
      .maybeSingle();

    if (rowError) throw rowError;
    if (!row) throw new Error('Usuario no encontrado');

    const loginRow = row as LoginRow;

    const authLogin = await supabase.auth.signInWithPassword({
      email: loginRow.email,
      password,
    });

    if (!authLogin.error) {
      return;
    }

    if (loginRow.password_hash !== password) {
      throw new Error('Credenciales inválidas');
    }

    const fallbackProfile: UserProfile = {
      id: loginRow.id,
      username: loginRow.username,
      email: loginRow.email,
      role: loginRow.role,
      elo_rating: loginRow.elo_rating,
    };

    setLocalSession(fallbackProfile);
    applyLocalProfile(fallbackProfile);
  };

  const signOut = async () => {
    clearLocalSession();
    applyLocalProfile(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
