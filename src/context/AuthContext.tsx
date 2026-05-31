import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useToast } from './ToastContext';
import posthog from '../utils/posthogClient';

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out (is the Supabase database waking up?)')), 5000)
    );

    try {
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        name: data.name,
        avatarUrl: data.avatar_url || undefined,
        coTaskerStatus: data.co_tasker_status || 'none',
        isDisabled: data.is_disabled,
        createdAt: data.created_at,
        password: '',
      };
    } catch (e) {
      return null;
    }
  }, []);

  // Listen to Supabase auth events
  useEffect(() => {
    let active = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        fetchUserProfile(session.user.id).then((profile) => {
          if (!active) return;
          if (profile) {
            if (profile.isDisabled) {
              supabase.auth.signOut();
              setCurrentUser(null);
              showToast('Your account has been disabled by an administrator.', 'error');
            } else {
              setCurrentUser(profile);
            }
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session) {
        const profile = await fetchUserProfile(session.user.id);
        if (!active) return;
        if (profile) {
          if (profile.isDisabled) {
            supabase.auth.signOut();
            setCurrentUser(null);
            showToast('Your account has been disabled by an administrator.', 'error');
          } else {
            setCurrentUser(profile);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, showToast]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          if (profile.isDisabled) {
            await supabase.auth.signOut();
            throw new Error('This account has been disabled by an administrator.');
          }
          setCurrentUser(profile);
          posthog.identify(profile.id, { email: profile.email, name: profile.name, role: profile.role });
          posthog.capture('account_logged_in', { role: profile.role });
        } else {
          throw new Error('User profile could not be loaded.');
        }
      }
    } catch (err) {
      posthog.captureException(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          setCurrentUser(profile);
          posthog.identify(profile.id, { email: profile.email, name: profile.name, role: profile.role });
          posthog.capture('account_signed_up', { role: profile.role });
        } else {
          const newProfile: User = {
            id: data.user.id,
            email: data.user.email ?? email,
            role: 'client',
            name,
            coTaskerStatus: 'none',
            isDisabled: false,
            createdAt: new Date().toISOString(),
            password: '',
          };
          setCurrentUser(newProfile);
          posthog.identify(newProfile.id, { email: newProfile.email, name: newProfile.name, role: newProfile.role });
          posthog.capture('account_signed_up', { role: 'client' });
        }
      }
    } catch (err) {
      posthog.captureException(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      posthog.reset();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCurrentUser = useCallback((userData: Partial<User>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, signUp, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

