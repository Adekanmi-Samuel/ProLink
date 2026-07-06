'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import Logo from '../../components/Logo';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation checks
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrongPassword = hasLength && hasUppercase && hasNumber;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    if (!isStrongPassword) {
      setErrorMsg('Please ensure your password meets all requirements.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message || 'Password has been successfully reset. You can now sign in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {!message && token && (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="password" className="field-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showResetPw ? 'text' : 'password'}
                required
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                style={{ paddingRight: '2.8rem' }}
              />
              <button type="button" onClick={() => setShowResetPw(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', display: 'flex', padding: '0.35rem' }} aria-label="Toggle password visibility">
                {showResetPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            
            <div className="pass-reqs">
              <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasLength ? '#34d399' : 'var(--fg-tertiary)' }}>
                <span>{hasLength ? '✓' : '○'}</span> At least 8 characters
              </div>
              <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasUppercase ? '#34d399' : 'var(--fg-tertiary)' }}>
                <span>{hasUppercase ? '✓' : '○'}</span> At least 1 uppercase letter
              </div>
              <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasNumber ? '#34d399' : 'var(--fg-tertiary)' }}>
                <span>{hasNumber ? '✓' : '○'}</span> At least 1 number
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="field-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPw ? 'text' : 'password'}
                required
                className="field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                style={{ paddingRight: '2.8rem' }}
              />
              <button type="button" onClick={() => setShowConfirmPw(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', display: 'flex', padding: '0.35rem' }} aria-label="Toggle password visibility">
                {showConfirmPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', color: passwordsMatch ? '#34d399' : 'var(--danger)' }}>
                <span>{passwordsMatch ? '✓' : '✗'}</span> {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>

          <motion.button
            className="btn btn-accent"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.25rem', border: 'none', cursor: loading || !isStrongPassword || !passwordsMatch ? 'not-allowed' : 'pointer' }}
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
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </motion.button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="orb orb-peach" style={{ width: '400px', height: '400px', top: '-5%', right: '-5%' }} />
        <div className="orb orb-cream" style={{ width: '400px', height: '400px', bottom: '-5%', left: '-5%' }} />
        <div className="orb orb-blush" style={{ width: '250px', height: '250px', top: '50%', left: '50%' }} />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
      >
        <div className="auth-card__header">
          <Link href="/" className="auth-card__logo">
            <Logo width={120} height={32} />
          </Link>
          <h1 className="auth-card__title">Choose a new password</h1>
          <p className="auth-card__sub">
            Create a strong new password for your account.
          </p>
        </div>

        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg-tertiary)' }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="auth-footer">
          <p>
            <Link href="/login" className="auth-link">Back to Sign in</Link>
          </p>
        </div>
      </motion.div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .auth-page { background: var(--bg); }
        .auth-page__bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .auth-page .orb-wrap { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .auth-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: var(--card-float-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--card-float-border);
          box-shadow: var(--card-float-shadow);
          border-radius: 24px;
          padding: 2.5rem 2rem;
        }
        .auth-card__header {
          text-align: center;
          margin-bottom: 1.75rem;
        }
        .auth-card__logo {
          display: inline-block;
          margin-bottom: 1.5rem;
        }
        .auth-card__title {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--fg);
          margin-bottom: 0.35rem;
        }
        .auth-card__sub {
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
        }
        .pass-reqs {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .auth-footer {
          text-align: center;
          margin-top: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .auth-footer p {
          font-size: 0.85rem;
          color: var(--fg-secondary);
        }
        .auth-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .auth-link:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
