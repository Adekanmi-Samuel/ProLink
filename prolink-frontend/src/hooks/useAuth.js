'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';

/**
 * useAuth hook - handles authentication and authorization
 * Protects routes based on user role
 */
export const useAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch the active profile based on the httpOnly cookie session
        const response = await api.get('/profiles/me');
        const userData = response.data;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
          // Genuinely not logged in — this is the only case that should redirect.
          setIsAuthenticated(false);
          setUser(null);
          if (!pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
            window.location.href = '/login';
          }
        } else {
          // Server error, network error, DB cold-start, etc. — NOT a logout.
          // Don't redirect; let the user retry instead of bouncing them out.
          setIsAuthenticated(false);
          setUser(null);
          console.error('Profile check failed (non-auth error), not redirecting:', error?.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Failed to logout on backend', error);
    }
    document.cookie = 'token=; Max-Age=0; path=/';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prolink_token');
    }
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    isClient: user?.user_type === 'client',
    isProvider: user?.user_type === 'provider',
  };
};

/**
 * withAuth HOC - wraps components to require authentication
 */
export const withAuth = (Component, requiredRole = null) => {
  return function ProtectedComponent(props) {
    const auth = useAuth();

    if (auth.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-slate-400">Loading...</div>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      return null; // Redirect handled by useAuth
    }

    if (requiredRole && auth.user?.user_type !== requiredRole) {
      return null; // Redirect handled by useAuth
    }

    return <Component {...props} auth={auth} />;
  };
};
