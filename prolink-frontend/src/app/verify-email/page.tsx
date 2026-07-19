'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import OtpInput from '../../components/OtpInput';

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [email, setEmail] = useState('');
  const router = useRouter();
  const hasSent = useRef(false);

  // Only set the email state on mount, don't auto-send because it was sent during signup/login
  useEffect(() => {
    if (hasSent.current) return;
    hasSent.current = true;
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('signupEmail') || '' : '';
    setEmail(storedEmail);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendCode = async () => {
    setSending(true);
    setCountdown(60);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/resend-verification');
      }
    } catch {
      // Try without auth too
      try {
        await api.post('/auth/send-verification', { email });
      } catch { /* noop */ }
    }
    setSending(false);
  };

  // Auto-submit when 6 digits
  useEffect(() => {
    if (otp.length === 6 && !loading && !success) {
      verifyCode(otp);
    }
  }, [otp]);

  const verifyCode = async (code: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await api.get(`/auth/verify?token=${code}`);
      setSuccess(true);
      localStorage.removeItem('signupEmail');
      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = () => {
    if (otp.length === 6 && !loading) verifyCode(otp);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', position: 'relative', background: 'var(--bg)' }}>
      <div className="geo-bg" />
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>Pro</span><span style={{ color: 'var(--fg)' }}>Link</span>
          </span>
        </div>

        <div className="card-float light" style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
          {/* Envelope icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--copper-alpha)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.6rem',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>Check your inbox</h2>
          <p style={{ color: 'var(--fg2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            We sent a 6-digit code to{' '}
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{email || 'your email'}</span>.
            Enter it below.
          </p>

          {/* OTP Input */}
          <div className={errorMsg ? 'shake' : ''}>
            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={loading || success}
              error={!!errorMsg}
              success={success}
            />
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.75rem' }}>
              {errorMsg}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <div className="spinner" />
            </div>
          )}

          {success && (
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, marginTop: '1rem' }}>
              ✓ Email verified! Redirecting…
            </div>
          )}

          {/* Manual verify button (accessibility) */}
          {!success && (
            <button
              onClick={handleVerifyClick}
              disabled={otp.length !== 6 || loading}
              className="btn btn-accent"
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center', border: 'none', padding: '12px 24px', fontSize: '0.95rem', cursor: otp.length !== 6 || loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          )}

          {/* Resend */}
          <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
            {countdown > 0 ? (
              <span>Resend code in <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>0:{String(countdown).padStart(2, '0')}</span></span>
            ) : (
              <button
                onClick={sendCode}
                disabled={sending}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--copper)', fontWeight: 600, fontSize: '0.82rem',
                  fontFamily: 'inherit',
                }}
              >
                {sending ? 'Sending…' : "Didn't get it? Resend →"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
