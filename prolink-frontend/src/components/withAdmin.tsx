'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import ProLinkLoader from './ui/ProLinkLoader';

export default function withAdmin(WrappedComponent: any) {
  return function AdminProtectedRoute(props: any) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAdmin = async () => {
        try {
          const res = await api.get('/profiles/me');
          if (res.data.user_type === 'admin') {
            setIsAuthorized(true);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          router.push('/login');
        } finally {
          setLoading(false);
        }
      };

      checkAdmin();
    }, [router]);

    if (loading) {
      return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
          <ProLinkLoader />
        </div>
      );
    }

    if (!isAuthorized) return null;

    return <WrappedComponent {...props} />;
  };
}
