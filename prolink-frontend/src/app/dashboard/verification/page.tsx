'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BADGE_VARIANT: Record<string, { bg: string; c: string; label: string }> = {
  verified: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Verified' },
  pending: { bg: 'rgba(234,179,8,0.12)', c: '#eab308', label: 'Pending Review' },
  none: { bg: 'rgba(107,114,128,0.1)', c: '#6b7280', label: 'Unverified' },
};

function VerificationPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [nin, setNin] = useState('');
  const [ninLoading, setNinLoading] = useState(false);
  const [cac, setCac] = useState('');
  const [cacLoading, setCacLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/profiles/me');
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNinLoading(true);
    try {
      await api.post('/verification/verify-nin', { nin_number: nin });
      alert('NIN submitted for manual review successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit NIN');
    } finally {
      setNinLoading(false);
    }
  };

  const handleCACSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCacLoading(true);
    try {
      await api.post('/verification/verify-cac', { cac_number: cac });
      alert('CAC submitted for review successfully.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit CAC');
    } finally {
      setCacLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  );

  const emailVerified = profile?.email_verified;
  const isProvider = profile?.user_type === 'provider';
  const ninStatus = profile?.nin_status || 'none';
  const cacStatus = profile?.cac_status || 'none';

  const renderBadge = (status: string) => {
    const v = BADGE_VARIANT[status] || BADGE_VARIANT.none;
    return (
      <motion.span
        style={{
          display: 'inline-block', padding: '0.15rem 0.65rem', borderRadius: 999,
          fontSize: '0.68rem', fontWeight: 700, background: v.bg, color: v.c,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {v.label}
      </motion.span>
    );
  };

  return (
    <motion.div
      style={{ maxWidth: 720, margin: '0 auto', padding: '1rem 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Verification</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '0.35rem' }}>Identity Verification</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          We require identity verification to keep ProLink safe and build trust between clients and service providers.
          Your data is encrypted and only used for verification purposes.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tier 1 */}
        <motion.div
          className="card glass"
          style={{ padding: '1.75rem' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tier 1: Basic Verification</h2>
                {renderBadge(emailVerified ? 'verified' : 'none')}
              </div>
              <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Requires a verified email address. This allows you to browse the platform and send messages.
              </p>
            </div>
            {!emailVerified && (
              <motion.a
                href="/verify-email"
                className="btn btn-accent"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                style={{ whiteSpace: 'nowrap' }}
              >Verify Email</motion.a>
            )}
          </div>
        </motion.div>

        {/* Tier 2 */}
        <motion.div
          className="card glass"
          style={{ padding: '1.75rem' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileHover={{ y: -1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tier 2: Verified Individual</h2>
            {renderBadge(ninStatus)}
          </div>
          <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            To accept jobs or hire freelancers, we need to verify your identity using your National Identity Number (NIN).
          </p>

          {ninStatus === 'none' && (
            <motion.form
              onSubmit={handleNINSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: 400 }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="nin-input" className="field-label">11-Digit NIN Number</label>
                <input
                  id="nin-input"
                  type="text"
                  className="field"
                  value={nin}
                  onChange={(e) => setNin(e.target.value)}
                  maxLength={11}
                  required
                  placeholder="e.g. 12345678901"
                />
              </div>
              <motion.button
                type="submit"
                className="btn btn-accent"
                disabled={ninLoading}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
              >
                {ninLoading ? 'Submitting...' : 'Submit'}
              </motion.button>
            </motion.form>
          )}
        </motion.div>

        {/* Tier 3 */}
        {isProvider && (
          <motion.div
            className="card glass"
            style={{ padding: '1.75rem' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            whileHover={{ y: -1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tier 3: Verified Business (Optional)</h2>
              {renderBadge(cacStatus)}
            </div>
            <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              If you operate as a registered business, verifying your Corporate Affairs Commission (CAC) number
              gives you the <strong>Verified Business</strong> badge, significantly increasing client trust.
            </p>

            {cacStatus === 'none' && (
              <motion.form
                onSubmit={handleCACSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: 400 }}
              >
                <div style={{ flex: 1 }}>
                  <label htmlFor="cac-input" className="field-label">CAC Registration Number</label>
                  <input
                    id="cac-input"
                    type="text"
                    className="field"
                    value={cac}
                    onChange={(e) => setCac(e.target.value)}
                    required
                    placeholder="e.g. RC 1234567"
                  />
                </div>
                <motion.button
                  type="submit"
                  className="btn btn-accent"
                  disabled={cacLoading}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {cacLoading ? 'Submitting...' : 'Submit'}
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default withAuth(VerificationPage);
