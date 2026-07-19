'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../../lib/api';
import { NIGERIAN_STATES } from '../../lib/states';
import { useTheme } from '../../components/ThemeProvider';

/* ── Password strength checker ── */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', 'var(--danger)', 'var(--copper)', 'var(--warning)', 'var(--accent)', 'var(--accent)'];

const NG_STATES = Object.keys(NIGERIAN_STATES);

/* ── Step indicator ── */
function StepIndicator({ step, steps }) {
  return (
    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
      {steps.map((l, i) => (
        <motion.div
          key={i}
          style={{ flex: 1, height: 4, borderRadius: 99, background: step >= i + 1 ? 'var(--accent)' : 'var(--border)', maxWidth: 60 }}
          animate={{ background: step >= i + 1 ? 'var(--accent)' : 'var(--border)' }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

/* ── Variants for step transitions ── */
const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22,  1,  0.36,  1] as any } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: [0.22,  1,  0.36,  1] as any } },
};

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const router = useRouter();
  const { theme } = useTheme();

  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const strength = getStrength(password);

  const nextStep = () => { setDirection(1); setStep(s => Math.min(s + 1, 3)); };
  const prevStep = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };

  const canContinueStep1 = role && fullName.trim().length >= 2 && email.includes('@') && phone.length >= 10 && state;
  const canContinueStep2 = password.length >= 8 && password === confirmPassword && agreedTerms;

  const handleSubmit = async () => {
    if (!canContinueStep1 || !canContinueStep2) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email, password, full_name: fullName, phone_number: phone, state,
        city: lga || undefined,
        user_type: role, referral_code: referralCode || undefined,
      });
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      toast.success('Account created! Welcome to ProLink.');
      router.push('/verify-email');
    } catch (err) {
      const errData = err.response?.data;
      let msg = errData?.msg || errData?.error || 'Registration failed. Please try again.';
      if (errData?.details?.length > 0) {
        msg = `${errData.details[0].path?.join('.') || 'Field'} is invalid: ${errData.details[0].message}`;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedLGAs = state ? (NIGERIAN_STATES[state] || []) : [];

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
        @media (max-width: 480px) {
          .signup-grid-2 { grid-template-columns: 1fr !important; }
          .signup-card { padding: 1.5rem 1.25rem !important; }
        }
      `}</style>

      {/* LEFT SIDE (DESKTOP ONLY) */}
      <div className="auth-left">
         <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ zIndex: 1, maxWidth: 480 }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-1.5px', lineHeight: 1.1 }}>Join ProLink.</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.85, lineHeight: 1.6 }}>Create your account today and unlock endless possibilities.</p>
         </motion.div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        {/* Warm ambient orbs */}
        <div className={`absolute inset-0 pointer-events-none overflow-hidden${theme === 'light' ? ' light' : ''}`}>
          <div className="orb orb-peach" style={{ width: '500px', height: '500px', top: '-10%', right: '-5%' }} />
          <div className="orb orb-cream" style={{ width: '450px', height: '450px', bottom: '-10%', left: '-5%' }} />
          <div className="orb orb-blush" style={{ width: '300px', height: '300px', top: '50%', left: '60%' }} />
        </div>

        <motion.div
          style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22,  1,  0.36,  1] as any }}
        >

          <motion.div
            className="card-elevated"
            style={{ padding: '2.5rem 2rem' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22,  1,  0.36,  1] as any }}
          >
          <StepIndicator step={step} steps={[1, 2, 3]} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
              {step === 1 && (
                <Step1
                  role={role} setRole={setRole}
                  fullName={fullName} setFullName={setFullName}
                  email={email} setEmail={setEmail}
                  phone={phone} setPhone={setPhone}
                  state={state} setState={setState}
                  lga={lga} setLga={setLga}
                  selectedLGAs={selectedLGAs}
                  canContinue={canContinueStep1}
                  onNext={nextStep}
                />
              )}
              {step === 2 && (
                <Step2
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms}
                  strength={strength}
                  canContinue={canContinueStep2}
                  onPrev={prevStep} onNext={nextStep}
                />
              )}
              {step === 3 && (
                <Step3
                  referralCode={referralCode} setReferralCode={setReferralCode}
                  loading={loading} role={role} fullName={fullName}
                  onPrev={prevStep} onSubmit={handleSubmit}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--fg-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </motion.div>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ══════ STEP 1 — Role + Personal Details ══════ */
function Step1({ role, setRole, fullName, setFullName, email, setEmail, phone, setPhone, state, setState, lga, setLga, selectedLGAs, canContinue, onNext }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: '0.15rem' }}>Create your account</h2>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>Step 1 of 3 - Tell us about yourself</p>
      </div>

      {/* Social Logins */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button type="button" className="social-btn" onClick={() => toast('Google signup coming soon!')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button type="button" className="social-btn" onClick={() => toast('Apple signup coming soon!')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.365 21.432c-1.396 1.045-2.695 1.077-4.148.06-1.472-1.025-2.73-1.076-4.205 0-1.745 1.258-3.086.877-4.22-1.79C1.222 15.65 1.072 10.428 3.968 7.62c1.47-1.442 3.107-1.583 4.417-.923 1.393.687 2.378.7 3.754 0 1.642-.782 3.167-.577 4.398.818-3.003 1.83-2.392 5.86.72 7.15-1.127 2.502-2.9 5.836-4.32 7.11M15.42 2.66c-.035 2.18-1.782 4.092-3.87 4.05-1.085.083-2.07-.406-2.73-1.218-.684-.81-1.066-1.89-1.02-3.003.023-2.122 1.837-3.957 3.844-3.882 1.144-.066 2.186.438 2.843 1.25.64.814 1.006 1.867 1.025 2.875"/>
          </svg>
          Continue with Apple
        </button>
      </div>

      <div className="divider">or continue with email</div>

      {/* Role selector */}
      <div>
        <div className="field-label" style={{ marginBottom: '0.4rem' }}>I want to</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { value: 'client', label: 'Hire talent', icon: '👔' },
            { value: 'provider', label: 'Find work', icon: '💼' },
          ].map(r => (
            <motion.button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                padding: '0.75rem 0.5rem', borderRadius: 'var(--radius)',
                border: '1.5px solid', cursor: 'pointer',
                borderColor: role === r.value ? 'var(--accent)' : 'var(--border)',
                background: role === r.value ? 'var(--accent-alpha)' : 'var(--surface)',
                color: role === r.value ? 'var(--accent)' : 'var(--fg-secondary)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 'var(--text-sm)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              whileHover={{ borderColor: role === r.value ? 'var(--accent)' : 'var(--border-hover)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
              {r.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="signup-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="field-group">
          <label className="field-label">Full name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Chidi Okonkwo" className="field" required />
        </div>
        <div className="field-group">
          <label className="field-label">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="chidi@example.com" className="field" required />
        </div>
      </div>

      <div className="signup-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="field-group">
          <label className="field-label">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0803 123 4567" className="field" required pattern="^(\+234|0)[789][01]\d{8}$" title="Enter a valid Nigerian phone number (e.g. 08012345678)" />
        </div>
        <div className="field-group">
          <label className="field-label">State</label>
          <select value={state} onChange={e => { setState(e.target.value); setLga(''); }} className="field" style={{ cursor: 'pointer' }} required>
            <option value="">Select state</option>
            {NG_STATES.filter(s => s !== 'Other').map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* LGA Dropdown */}
      {state && selectedLGAs.length > 0 && (
        <div className="field-group">
          <label className="field-label">LGA / City</label>
          <select value={lga} onChange={e => setLga(e.target.value)} className="field" style={{ cursor: 'pointer' }}>
            <option value="">Select LGA</option>
            {selectedLGAs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="btn btn-accent"
        style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', cursor: !canContinue ? 'not-allowed' : 'pointer', opacity: !canContinue ? 0.6 : 1, border: 'none', padding: '12px 24px', fontSize: '0.95rem' }}
        whileHover={canContinue ? { y: -2 } : {}}
        whileTap={canContinue ? { scale: 0.98 } : {}}
      >
        Continue →
      </motion.button>
    </div>
  );
}

/* ══════ STEP 2 — Password + Terms ══════ */
function Step2({ password, setPassword, confirmPassword, setConfirmPassword, agreedTerms, setAgreedTerms, strength, canContinue, onPrev, onNext }) {
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: '0.15rem' }}>Secure your account</h2>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>Step 2 of 3 - Create a strong password</p>
      </div>

      <div className="field-group">
        <label className="field-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showSignupPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="field" style={{ paddingRight: '2.8rem' }} />
          <button type="button" onClick={() => setShowSignupPw(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', display: 'flex', padding: '0.35rem' }} aria-label="Toggle password visibility">
            {showSignupPw ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
        {password && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.3rem' }}>
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.15rem' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 9999, background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: STRENGTH_COLORS[strength], fontWeight: 600 }}>{STRENGTH_LABELS[strength]}</span>
          </motion.div>
        )}
      </div>

      <div className="field-group">
        <label className="field-label">Confirm password</label>
        <div style={{ position: 'relative' }}>
          <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" className="field" style={{ paddingRight: '2.8rem' }} />
          <button type="button" onClick={() => setShowConfirmPw(v => !v)} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', display: 'flex', padding: '0.35rem' }} aria-label="Toggle confirm password visibility">
            {showConfirmPw ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
          {confirmPassword && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', right: '2.8rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: password === confirmPassword ? 'var(--success)' : 'var(--danger)' }}>
              {password === confirmPassword && confirmPassword.length >= 8 ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : confirmPassword.length >= 6 ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem' }}>
        <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ marginTop: '0.2rem', accentColor: 'var(--accent)', width: 16, height: 16 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
          I agree to ProLink&apos;s{' '}
          <Link href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</Link>
        </span>
      </label>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <motion.button type="button" onClick={onPrev} className="btn-ghost-warm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: 'none', padding: '12px 24px', fontSize: '0.9rem' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          ← Back
        </motion.button>
        <motion.button type="button" onClick={onNext} disabled={!canContinue} className="btn btn-accent" style={{ flex: 1, justifyContent: 'center', cursor: !canContinue ? 'not-allowed' : 'pointer', opacity: !canContinue ? 0.6 : 1, border: 'none', padding: '12px 24px', fontSize: '0.95rem' }} whileHover={canContinue ? { y: -2 } : {}} whileTap={canContinue ? { scale: 0.98 } : {}}>
          Continue →
        </motion.button>
      </div>
    </div>
  );
}

/* ══════ STEP 3 — Referral + Final Submit ══════ */
function Step3({ referralCode, setReferralCode, loading, role, onPrev, onSubmit, fullName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 className="section-title" style={{ fontSize: 'var(--text-xl)', marginBottom: '0.15rem' }}>Almost done</h2>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>Step 3 of 3 - Optional referral code</p>
      </div>

      <div className="field-group">
        <label className="field-label">Referral code (optional)</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="e.g. OPATA2025" className="field" style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1 }} />
          <button type="button" onClick={() => setReferralCode((fullName.split(' ')[0].toUpperCase().slice(0, 4) || 'USER') + Math.random().toString(36).substring(2, 6).toUpperCase())} style={{ padding: '0 1rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--fg-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Generate referral code">
            Generate
          </button>
        </div>
        <span className="field-hint">Know someone on ProLink? Enter their referral code. Or generate your own.</span>
      </div>

      <motion.div
        className="card-featured"
        style={{ padding: '1rem', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>You&apos;re signing up as:</div>
        <div style={{ color: role === 'provider' ? 'var(--gold)' : 'var(--info)', fontWeight: 600 }}>
          {role === 'provider' ? '💼 Provider - looking for work' : '👔 Client - hiring talent'}
        </div>
        <div style={{ color: 'var(--fg-tertiary)', marginTop: '0.4rem', fontSize: 'var(--text-xs)' }}>You can change this later in your settings.</div>
      </motion.div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <motion.button type="button" onClick={onPrev} className="btn-ghost-warm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', border: 'none', padding: '12px 24px', fontSize: '0.9rem' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          ← Back
        </motion.button>
        <motion.button type="button" onClick={onSubmit} disabled={loading} className="btn btn-accent" style={{ flex: 1, justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, border: 'none', padding: '12px 24px', fontSize: '0.95rem' }} whileHover={loading ? {} : { y: -2 }} whileTap={loading ? {} : { scale: 0.98 }}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating…</> : 'Create account'}
        </motion.button>
      </div>
    </div>
  );
}
