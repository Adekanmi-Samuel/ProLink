'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlToken = searchParams.get('token');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [manualToken, setManualToken] = useState('');

  const verifyToken = async (tokenToVerify: string) => {
    setStatus('loading');
    setMessage('Verifying your email...');
    try {
      await api.get(`/auth/verify?token=${tokenToVerify}`);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to verify email. The token might be expired or invalid.');
    }
  };

  useEffect(() => {
    if (urlToken) {
      verifyToken(urlToken);
    }
  }, [urlToken]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyToken(manualToken.trim());
    }
  };

  const statusIcons = { idle: '📧', loading: '⏳', success: '✅', error: '❌' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.25rem 2rem', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <motion.div
        style={{
          position: 'absolute', top: '-15%', left: '40%',
          width: 500, height: 450,
          background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22,  1,  0.36,  1] as any }}
      >
        <motion.div
          className="card-elevated"
          style={{ padding: '2.5rem 2rem', textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22,  1,  0.36,  1] as any }}
        >
          {/* Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }}
          >
            {statusIcons[status]}
          </motion.div>

          <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: '0.5rem' }}>
            {status === 'success' ? 'Verified!' : status === 'error' ? 'Verification failed' : status === 'loading' ? 'Checking...' : 'Email Verification'}
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {status === 'idle' && (
                <>
                  <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
                    {urlToken ? 'Verifying your token...' : 'Enter your verification token below or click the link sent to your email.'}
                  </p>
                  {!urlToken && (
                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Paste your verification token"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className="field"
                        style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}
                        required
                      />
                      <motion.button
                        type="submit"
                        className="btn btn-accent btn-lg"
                        style={{ width: '100%', justifyContent: 'center' }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Verify Email
                      </motion.button>
                    </form>
                  )}
                  {urlToken && (
                    <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
                      Automatically verifying...
                    </p>
                  )}
                </>
              )}

              {status === 'loading' && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                </div>
              )}

              {status === 'success' && (
                <>
                  <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{message}</p>
                  <p style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Redirecting to dashboard in 3 seconds...</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>{message}</p>
                  <motion.button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="btn btn-outline btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Again
                  </motion.button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
