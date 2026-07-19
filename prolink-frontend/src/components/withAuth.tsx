// src/components/withAuth.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { hasAuthCookie } from '../lib/api';
import ProLinkLoader from './ui/ProLinkLoader';

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  // This is the component that will be returned
  const AuthComponent = (props: Record<string, unknown>) => {
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
      return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
          <ProLinkLoader />
        </div>
      );
    }

    // If everything is fine, render the actual page (e.g., the Dashboard)
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
