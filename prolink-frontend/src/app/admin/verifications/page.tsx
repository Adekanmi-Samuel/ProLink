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
    return (
      <div className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  const pendingNIN = profiles.filter(p => p.nin_status === 'pending');
  const pendingCAC = profiles.filter(p => p.cac_status === 'pending');

  return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <motion.div
          className="dash-banner"
          style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-hover) 100%)', borderTop: '4px solid var(--fg)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
        >
          <div className="dash-banner__eyebrow">Admin</div>
          <h1 className="dash-banner__name">Verification Requests</h1>
          <p className="dash-banner__sub">Review and approve user identity and business documents</p>
        </motion.div>

        {/* NIN Section */}
        <motion.div
          style={{ marginBottom: '2rem' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="dash-section-header">
            <h2 className="dash-section-title">Pending NIN Verifications ({pendingNIN.length})</h2>
          </div>
          {pendingNIN.length > 0 ? (
            <motion.div className="card-base" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                          <td style={{ ...td, color: 'var(--fg-secondary)', fontSize: '0.85rem' }}>{profile.user?.email}</td>
                          <td style={{ ...td, fontFamily: 'var(--font-mono), monospace', fontSize: '0.85rem' }}>{profile.nin_number}</td>
                          <td style={{ ...td, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleReview(profile.user_id, 'nin', 'approve')}
                                className="btn btn-sm"
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(profile.user_id, 'nin', 'reject')}
                                className="btn btn-sm"
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)' }}
                              >
                                Reject
                              </button>
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
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="empty-state-icon">✔️</div>
              <div className="empty-state-title">No pending NIN verifications.</div>
            </motion.div>
          )}
        </motion.div>

        {/* CAC Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="dash-section-header">
            <h2 className="dash-section-title">Pending CAC Verifications ({pendingCAC.length})</h2>
          </div>
          {pendingCAC.length > 0 ? (
            <motion.div className="card-base" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                          <td style={{ ...td, color: 'var(--fg-secondary)', fontSize: '0.85rem' }}>{profile.user?.email}</td>
                          <td style={{ ...td, fontFamily: 'var(--font-mono), monospace', fontSize: '0.85rem' }}>{profile.cac_number}</td>
                          <td style={{ ...td, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleReview(profile.user_id, 'cac', 'approve')}
                                className="btn btn-sm"
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(profile.user_id, 'cac', 'reject')}
                                className="btn btn-sm"
                                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)' }}
                              >
                                Reject
                              </button>
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
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="empty-state-icon">✔️</div>
              <div className="empty-state-title">No pending CAC verifications.</div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

const th = { padding: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--fg-tertiary)' };
const td = { padding: '1rem', fontSize: '0.85rem' };

export default withAdmin(AdminVerificationsPage);
