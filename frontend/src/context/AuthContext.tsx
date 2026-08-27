import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: string | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isPlatformAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error);
      }
      
      if (session?.user) {
        if (mounted) {
          setUser(session.user);
          await fetchRole(session.user.id);
        }
      } else {
        if (mounted) {
          setUser(null);
          setRole(null);
          setIsPlatformAdmin(false);
          setLoading(false);
        }
      }
    }

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setIsPlatformAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async (userId: string) => {
    try {
      let result = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 

      // Supabase clock drift workaround
      if (result.error && result.error.message.includes('JWT issued at future')) {
        console.warn('Clock drift detected, retrying role fetch in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      }

      const { data, error } = result;

      if (error) {
        console.error('Failed to fetch role:', error.message);
        // If we can't find the user profile, sign them out to clear stale session
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setIsPlatformAdmin(false);
        return;
      }

      if (data) {
        setRole(data.role);
        setIsPlatformAdmin(data.is_platform_admin || false);
      } else {
        // User exists in auth but has no profile row yet (e.g. pending OTP verification)
        // Keep them logged in but with no role — UI can handle this state
        setRole(null);
        setIsPlatformAdmin(false);
      }
    } catch (err) {
      console.error('Failed to fetch role', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
    } catch (error) {
      console.error('Backend logout failed', error);
    } finally {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, isPlatformAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
