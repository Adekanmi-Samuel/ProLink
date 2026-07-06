'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAdmin from '../../../components/withAdmin';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVerifications(); }, []);

  const fetchVerifications = async () => {
    try {
      const res = await api.get('/admin/verifications');
      setProfiles(res.data);
    } catch (error) {
      console.error('Failed to fetch verifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId: number, type: 'nin' | 'cac', action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} the ${type.toUpperCase()} verification for this user?`)) return;
    try {
      await api.post('/admin/verifications/review', { userId, type, action });
      fetchVerifications();
    } catch (error) {
      alert('Failed to review verification');
    }
  };

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
      />
    </div>;
  }

  const pendingNIN = profiles.filter(p => p.nin_status === 'pending');
  const pendingCAC = profiles.filter(p => p.cac_status === 'pending');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: FAUCET_EASING }} style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="eyebrow">Admin</div>
        <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Verification Requests</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.92rem' }}>Review and approve user identity and business documents</p>
      </div>

      {/* NIN Section */}
      <motion.div
        style={{ marginBottom: '2rem' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Pending NIN Verifications ({pendingNIN.length})
        </h2>
        {pendingNIN.length > 0 ? (
          <motion.div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="verify-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                    <th style={th}>User ID</th>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>NIN Number</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pendingNIN.map((profile, i) => (
                      <motion.tr
                        key={profile.user_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.03 * i }}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        whileHover={{ background: 'var(--accent-alpha)' }}
                      >
                        <td style={td}>#{profile.user_id}</td>
                        <td style={td}><strong>{profile.full_name || 'N/A'}</strong></td>
                        <td style={{ ...td, color: 'var(--fg-secondary)', fontSize: '0.82rem' }}>{profile.user?.email}</td>
                        <td style={{ ...td, fontFamily: 'var(--font-mono), monospace', fontSize: '0.82rem' }}>{profile.nin_number}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <motion.button
                              onClick={() => handleReview(profile.user_id, 'nin', 'approve')}
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              onClick={() => handleReview(profile.user_id, 'nin', 'reject')}
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Reject
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2.5rem', textAlign: 'center', color: 'var(--fg-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No pending NIN verifications.
          </motion.div>
        )}
      </motion.div>

      {/* CAC Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
          Pending CAC Verifications ({pendingCAC.length})
        </h2>
        {pendingCAC.length > 0 ? (
          <motion.div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="verify-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                    <th style={th}>User ID</th>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>CAC Number</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pendingCAC.map((profile, i) => (
                      <motion.tr
                        key={profile.user_id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.03 * i }}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        whileHover={{ background: 'var(--accent-alpha)' }}
                      >
                        <td style={td}>#{profile.user_id}</td>
                        <td style={td}><strong>{profile.full_name || 'N/A'}</strong></td>
                        <td style={{ ...td, color: 'var(--fg-secondary)', fontSize: '0.82rem' }}>{profile.user?.email}</td>
                        <td style={{ ...td, fontFamily: 'var(--font-mono), monospace', fontSize: '0.82rem' }}>{profile.cac_number}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <motion.button
                              onClick={() => handleReview(profile.user_id, 'cac', 'approve')}
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Approve
                            </motion.button>
                            <motion.button
                              onClick={() => handleReview(profile.user_id, 'cac', 'reject')}
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}
                              whileHover={{ y: -1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Reject
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2.5rem', textAlign: 'center', color: 'var(--fg-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No pending CAC verifications.
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

const th = { padding: '0.75rem 0.85rem', textAlign: 'left' as const, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--fg-tertiary)' };
const td = { padding: '0.65rem 0.85rem', fontSize: '0.85rem' };

export default withAdmin(AdminVerificationsPage);
