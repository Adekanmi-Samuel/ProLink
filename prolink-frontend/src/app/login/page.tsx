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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        remember_me: rememberMe,
      });
      // Always store token in localStorage so it persists across tabs
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
        }
        .auth-left {
          display: none;
        }
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
          position: relative;
        }
        @media (min-width: 1024px) {
          .auth-left {
            display: flex;
            flex: 1;
            background: linear-gradient(135deg, var(--accent) 0%, #0d0d12 100%);
            align-items: center;
            justify-content: center;
            color: white;
            padding: 4rem;
            flex-direction: column;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .auth-right {
            flex: 1;
            max-width: 55%;
          }
        }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.8rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--fg);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .social-btn:hover {
          background: var(--surface2);
        }
        .social-btn:active {
          transform: scale(0.98);
        }
        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: var(--fg-tertiary);
          font-size: 0.85rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border);
        }
        .divider:not(:empty)::before {
          margin-right: 1rem;
        }
        .divider:not(:empty)::after {
          margin-left: 1rem;
        }
      `}</style>

      {/* LEFT SIDE (DESKTOP ONLY) */}
      <div className="auth-left">
         <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ zIndex: 1, maxWidth: 480 }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-1.5px', lineHeight: 1.1 }}>Welcome to ProLink.</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.85, lineHeight: 1.6 }}>Connect with top talent and find the best opportunities tailored to you.</p>
         </motion.div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        {/* Ambient orbs */}
        <div className={`absolute inset-0 pointer-events-none overflow-hidden${theme === 'light' ? ' light' : ''}`}>
          <div className="orb orb-peach" style={{ width: '500px', height: '500px', top: '-10%', right: '-5%' }} />
          <div className="orb orb-cream" style={{ width: '450px', height: '450px', bottom: '-10%', left: '-5%' }} />
          <div className="orb orb-blush" style={{ width: '300px', height: '300px', top: '50%', left: '60%' }} />
        </div>
        
        <motion.div
          style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22,  1,  0.36,  1] as any }}
        >
          <motion.div
            className="card-elevated"
            style={{ padding: '2.5rem 2rem' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22,  1,  0.36,  1] as any }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', fontWeight: 700 }}>Welcome back</h2>
            <p style={{ color: 'var(--fg-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>Sign in to your account</p>

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

            {/* Social Logins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button type="button" className="social-btn" onClick={() => toast('Google login coming soon!')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button type="button" className="social-btn" onClick={() => toast('Apple login coming soon!')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={theme === 'light' ? '#000' : '#fff'}>
                  <path d="M16.365 21.432c-1.396 1.045-2.695 1.077-4.148.06-1.472-1.025-2.73-1.076-4.205 0-1.745 1.258-3.086.877-4.22-1.79C1.222 15.65 1.072 10.428 3.968 7.62c1.47-1.442 3.107-1.583 4.417-.923 1.393.687 2.378.7 3.754 0 1.642-.782 3.167-.577 4.398.818-3.003 1.83-2.392 5.86.72 7.15-1.127 2.502-2.9 5.836-4.32 7.11M15.42 2.66c-.035 2.18-1.782 4.092-3.87 4.05-1.085.083-2.07-.406-2.73-1.218-.684-.81-1.066-1.89-1.02-3.003.023-2.122 1.837-3.957 3.844-3.882 1.144-.066 2.186.438 2.843 1.25.64.814 1.006 1.867 1.025 2.875"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="divider">or sign in with email</div>

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
              style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--fg-tertiary)' }}
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
