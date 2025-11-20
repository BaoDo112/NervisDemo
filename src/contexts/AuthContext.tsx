import React, { useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext } from './AuthContextBase';
import type { AuthContextType, UserProfile, UserRole } from './auth-types';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const ensureUserProfile = useCallback(async (u: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', u.id)
        .maybeSingle();
      if (error) {
        console.error('Error checking user profile:', error);
      }
      if (!data) {
        const role = (u.user_metadata?.role as UserRole) || 'job_seeker';
        const full_name = (u.user_metadata?.full_name as string) || '';
        const insertRes = await supabase
          .from('users')
          .insert({
            id: u.id,
            email: u.email || '',
            full_name,
            role,
            profile_data: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .single();
        if (insertRes.error) {
          console.error('Error creating user profile:', insertRes.error);
        } else {
          setProfile(insertRes.data as UserProfile);
          return;
        }
      }
      await fetchUserProfile(u.id);
    } catch (e) {
      console.error('Error ensuring user profile:', e);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          void ensureUserProfile(session.user);
        } else {
          setProfile(null);
        }
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          void ensureUserProfile(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserProfile]);

  const signUp = async (email: string, password: string, userData: { full_name: string; role: UserRole }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const u = data.user;
        const role = (u.user_metadata?.role as UserRole) || userData.role;
        const full_name = (u.user_metadata?.full_name as string) || userData.full_name;
        await supabase
          .from('users')
          .upsert({
            id: u.id,
            email: u.email || email,
            full_name,
            role,
            profile_data: {},
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      return { error };
    } catch (error) {
      setSession(null);
      setUser(null);
      setProfile(null);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { error: new Error(error.message) };
      }

      // Refresh profile
      await fetchUserProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};