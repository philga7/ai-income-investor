'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: AuthError | null;
  }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{
    error: AuthError | null;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const signUp = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (response.error) {
        // Only log detailed errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase signup error details:', {
            code: response.error.code,
            message: response.error.message,
            status: response.error.status,
            name: response.error.name,
            error: response.error
          });
        }
        return { error: response.error };
      }
      
      return { error: null };
    } catch (error) {
      // Only log unexpected errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected signup error:', error);
      }
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    try {
      if (!session?.access_token) {
        return { error: { name: 'AuthError', message: 'No access token', status: 401 } as AuthError };
      }
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        return { error: { name: 'AuthError', message: data.error || 'Failed to delete account', status: res.status } as AuthError };
      }
      
      // Clear the session state locally
      setUser(null);
      setSession(null);
      
      // Sign out without any scope parameter
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // If sign out fails, we can ignore it since we've already cleared the local state
        console.warn('Sign out failed after account deletion:', signOutError);
      }
      
      return { error: null };
    } catch (error) {
      // Only log unexpected errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected delete account error:', error);
      }
      return { error: error as AuthError };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 