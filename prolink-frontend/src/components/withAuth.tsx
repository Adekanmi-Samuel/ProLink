// src/components/withAuth.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

const withAuth = (WrappedComponent) => {
  // This is the component that will be returned
  const AuthComponent = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Verify auth by calling the API (httpOnly cookie is sent automatically)
      const checkAuth = async () => {
        try {
          await api.get('/profiles/me');
          setIsLoading(false);
        } catch {
          router.replace('/login');
        }
      };
      checkAuth();
    }, [router]);

    if (isLoading) {
      // Show a generic loading state while we check for the token
      return (
        <div className="loading-page flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="navbar-logo" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.8, animation: 'pulse 2s infinite' }}>
            <span className="navbar-logo-accent">Pro</span><span className="navbar-logo-fg">Link</span>
          </div>
          <div className="pl-spinner" style={{ width: 24, height: 24 }} />
        </div>
      );
    }

    // If everything is fine, render the actual page (e.g., the Dashboard)
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
