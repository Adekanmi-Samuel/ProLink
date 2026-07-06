'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../lib/api';
import { useTheme } from '../../components/ThemeProvider';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      toast.success('Account created! Welcome to ProLink.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        remember_me: rememberMe,
      });
      localStorage.setItem('prolink_token', response.data.token);
      router.push('/dashboard');
    } catch (error) {
      setErrorMsg(error.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', position: 'relative', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Cool ambient orbs */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden${theme === 'light' ? ' light' : ''}`}>
        <div className="orb orb-peach" style={{ width: '500px', height: '500px', top: '-10%', right: '-5%' }} />
        <div className="orb orb-cream" style={{ width: '450px', height: '450px', bottom: '-10%', left: '-5%' }} />
        <div className="orb orb-blush" style={{ width: '300px', height: '300px', top: '50%', left: '60%' }} />
      </div>
      <motion.div
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >

        <motion.div
          className="card-elevated"
          style={{ padding: '2rem 1.75rem' }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Sign in to your account</p>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                color: 'var(--danger)', borderRadius: 'var(--radius)',
                padding: '0.65rem 0.9rem', fontSize: '0.82rem', marginBottom: '1rem',
              }}
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <motion.div
              className="field-group"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label htmlFor="email" className="field-label">Email address</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="field" />
            </motion.div>

            <motion.div
              className="field-group"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="field-label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="field" style={{ paddingRight: '2.8rem' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', display: 'flex', padding: '0.35rem' }} aria-label="Toggle password visibility">
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <span
                  className={`check-custom${rememberMe ? ' checked' : ''}`}
                  onClick={() => setRememberMe(v => !v)}
                >
                  {rememberMe && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--fg-secondary)' }}>Stay signed in for 30 days</span>
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44 }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                className="btn btn-accent"
                style={{ width: '100%', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, border: 'none', padding: '12px 24px', fontSize: '0.95rem' }}
                whileHover={loading ? {} : { y: -2 }}
                whileTap={loading ? {} : { scale: 0.98 }}
              >
                {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in…</> : 'Sign in'}
              </motion.button>
            </motion.div>
          </form>

          <motion.div
            style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--fg-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free →
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
