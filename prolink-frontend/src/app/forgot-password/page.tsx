'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../lib/api';
import Logo from '../../components/Logo';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'If an account with that email exists, a password reset link has been sent.');
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      setErrorMsg(data?.error || (status === 500 ? 'Server error. Please try again.' : 'Failed to request password reset. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden light">
        <div className="orb orb-peach" style={{ width: '400px', height: '400px', top: '-5%', right: '-5%' }} />
        <div className="orb orb-cream" style={{ width: '400px', height: '400px', bottom: '-5%', left: '-5%' }} />
        <div className="orb orb-blush" style={{ width: '250px', height: '250px', top: '50%', left: '50%' }} />
      </div>

        <motion.div
          className="card-float light"
          style={{ width: '100%', maxWidth: 440, padding: '2.5rem 2rem' }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
        >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <Logo width={120} height={32} />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg)', marginBottom: '0.35rem' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--fg-secondary)' }}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: 'var(--danger-bg)', border: '1.5px solid var(--danger)',
                color: 'var(--danger)', borderRadius: 'var(--radius)', padding: '0.7rem 1rem',
                fontSize: '0.85rem', marginBottom: '1.25rem',
              }}
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: 'var(--success-bg)', border: '1.5px solid var(--success)',
                color: 'var(--success)', borderRadius: 'var(--radius)', padding: '0.7rem 1rem',
                fontSize: '0.85rem', marginBottom: '1.25rem',
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {!message && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="email-forgot" className="field-label">Email address</label>
              <input
                id="email-forgot"
                type="email"
                required
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || !email}
              className="btn btn-accent"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.25rem' }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </motion.button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
