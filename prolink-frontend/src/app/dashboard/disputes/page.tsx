'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';
import Link from 'next/link';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const response = await api.get('/disputes/my-disputes');
        setDisputes(response.data || []);
      } catch (error) {
        console.error('Failed to load disputes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const openDetail = async (d: any) => {
    setSelectedDispute(d);
    setDetailLoading(true);
    setEvidenceNote('');
    setEvidenceUrl('');
    try {
      const res = await api.get(`/disputes/${d.id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error('Failed to fetch dispute detail', err);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceNote.trim() && !evidenceUrl.trim()) return;
    try {
      await api.post(`/disputes/${selectedDispute.id}/evidence`, { note: evidenceNote, fileUrl: evidenceUrl || undefined });
      setEvidenceNote('');
      setEvidenceUrl('');
      const res = await api.get(`/disputes/${selectedDispute.id}`);
      setDetailData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to add evidence');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { bg: 'rgba(234,179,8,0.12)', c: '#eab308', label: 'Under Review' },
      resolved_refunded: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Resolved (Refunded)' },
      resolved_released: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Resolved (Released)' },
      resolved_split: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Resolved (Split)' },
    };
    const v = variants[status] || { bg: 'rgba(107,114,128,0.1)', c: '#6b7280', label: status.replace(/_/g, ' ') };
    return (
      <motion.span
        style={{ display: 'inline-block', padding: '0.15rem 0.65rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, background: v.bg, color: v.c, textTransform: 'uppercase', letterSpacing: '0.04em' }}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
      style={{ maxWidth: 1000 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-eyebrow" style={{ marginBottom: '0.35rem' }}>Disputes</div>
        <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--fg)' }}>
          Dispute Center
        </h1>
        <p style={{ color: 'var(--fg-tertiary)', marginTop: '0.25rem' }}>
          Track and manage your escalated milestones.
        </p>
      </div>

      <div className="card glass" style={{ padding: 0 }}>
        {disputes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '4rem 2rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--fg)', marginBottom: '0.5rem' }}>No Active Disputes</h3>
            <p style={{ color: 'var(--fg-tertiary)' }}>You don&apos;t have any disputed milestones right now.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
              {disputes.map((d: any, i: number) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 * i, ease: FAUCET_EASING }}
                  style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  whileHover={{ background: 'var(--accent-alpha)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        Dispute #{d.id} • Initiated by {d.initiator?.profile?.full_name}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--fg)', marginTop: '0.25rem' }}>
                        {d.milestone?.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.25rem' }}>
                        Job: {d.milestone?.job?.title}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      {getStatusBadge(d.status)}
                      {d.split_percentage && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)' }}>Split: Provider got {d.split_percentage}%</span>
                      )}
                      {d.status === 'open' && (
                        <motion.button
                          onClick={() => openDetail(d)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          View Details
                        </motion.button>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--surface2)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--fg-tertiary)', fontWeight: 600, marginBottom: '0.25rem' }}>Reason for Dispute:</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--fg)' }}>{d.reason}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--fg-tertiary)' }}>
                        Escalated on {new Date(d.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {d.response_deadline && (
                        <span style={{ fontSize: '0.72rem', color: new Date(d.response_deadline) < new Date() ? '#ef4444' : '#22c55e' }}>
                          {new Date(d.response_deadline) < new Date() ? 'Past deadline' : `Respond by ${new Date(d.response_deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}
                        </span>
                      )}
                    </div>
                    <Link href={`/dashboard/contracts/${d.milestone?.job?.id}`} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.78rem' }}>
                      View Contract →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDispute && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 100, padding: '1rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedDispute(null); setDetailData(null); }}
          >
            <motion.div
              style={{
                background: 'var(--surface)', borderRadius: 'var(--radius)',
                padding: '1.5rem', maxWidth: 600, width: '100%', position: 'relative',
                maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'none', border: 'none', color: 'var(--fg-tertiary)',
                  fontSize: '1.25rem', cursor: 'pointer', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                }}
                whileHover={{ background: 'var(--surface2)', color: 'var(--fg)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSelectedDispute(null); setDetailData(null); }}
              >
                ✕
              </motion.button>

              <div style={{ marginBottom: '1rem' }}>
                <div className="section-eyebrow" style={{ marginBottom: '0.35rem' }}>Dispute #{selectedDispute.id}</div>
                <h2 style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
                  {selectedDispute.milestone?.title || `Milestone #${selectedDispute.milestone_id}`}
                </h2>
              </div>

              {detailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }}
                  />
                </div>
              ) : detailData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Reason */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Reason</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--fg)', background: 'var(--surface2)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                      {selectedDispute.reason}
                    </p>
                  </div>

                  {/* Evidence */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Evidence</h4>
                    {detailData.evidence?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {detailData.evidence.map((ev: any) => (
                          <motion.div key={ev.id} style={{ padding: '0.75rem', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                              <strong style={{ color: 'var(--fg)' }}>{ev.submitter?.profile?.full_name || 'User'}</strong>
                              <span style={{ color: 'var(--fg-tertiary)' }}>{new Date(ev.created_at).toLocaleString()}</span>
                            </div>
                            {ev.note && <p style={{ fontSize: '0.85rem', color: 'var(--fg)', margin: 0 }}>{ev.note}</p>}
                            {ev.file_url && (
                              <a href={ev.file_url} target="_blank" rel="noopener" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none', marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                📎 View Attachment
                              </a>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.85rem' }}>No evidence submitted yet.</p>
                    )}

                    {selectedDispute.status === 'open' && (
                      <motion.div
                        style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--fg)' }}>Add Evidence</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <textarea rows={2} placeholder="Add a note or context..." value={evidenceNote} onChange={e => setEvidenceNote(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }} />
                          <input type="text" placeholder="Attachment URL (optional)" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: '0.85rem' }} />
                          <motion.button
                            onClick={handleAddEvidence}
                            className="btn btn-accent"
                            style={{ alignSelf: 'flex-end', fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Submit Evidence
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {detailData.isWithinResponseWindow !== undefined && (
                    <div style={{
                      fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
                      background: detailData.isWithinResponseWindow ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: detailData.isWithinResponseWindow ? '#22c55e' : '#ef4444'
                    }}>
                      {detailData.isWithinResponseWindow ? '✅ Within response window' : '⏰ Past response deadline'}
                    </div>
                  )}

                  {selectedDispute.admin_notes && (
                    <div>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Admin Notes</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--fg)', fontStyle: 'italic' }}>{selectedDispute.admin_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--fg-tertiary)' }}>Could not load dispute details.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default withAuth(DisputesPage);
