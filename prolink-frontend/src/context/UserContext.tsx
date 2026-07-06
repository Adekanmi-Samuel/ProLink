'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  user_type: 'client' | 'provider' | 'admin';
  email_verified: boolean;
  nin_status?: string;
  cac_status?: string;
  profile_completed: boolean;
  avatar_url?: string | null;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.get('/profiles/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    setUser(null);
    // Clear token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prolink_token');
      document.cookie = 'token=; Max-Age=0; path=/';
    }
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
