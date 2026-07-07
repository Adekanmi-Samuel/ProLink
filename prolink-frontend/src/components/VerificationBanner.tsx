'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify'];

export default function VerificationBanner() {
  const [user, setUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setUser(null);
      return;
    }
    const fetchUser = async () => {
      const { hasAuthCookie } = require('../lib/api');
      const hasCookie = hasAuthCookie();
      if (!hasCookie) return;

      try {
        const response = await api.get('/profiles/me');
        setUser(response.data);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      alert("Verification email sent! Check your inbox.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to resend email.");
    } finally {
      setSending(false);
    }
  };

  if (!user || user.email_verified || pathname === '/verify-email' || dismissed) {
    return null;
  }

  return (
    <div className="verify-toast" style={{ marginTop: 'var(--navbar-h)' }}>
      <button className="verify-toast-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="verify-toast-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="verify-toast-body">
        <div className="verify-toast-title">Verify your email</div>
        <div className="verify-toast-text">Use the 6-digit code sent to your email to unlock all features.</div>
        <div className="verify-toast-actions">
          <Link href="/verify-email" className="verify-toast-btn">Verify Now</Link>
          <button onClick={handleResend} disabled={sending} className="verify-toast-link">
            {sending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
