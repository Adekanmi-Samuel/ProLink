'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAdmin from '../../../components/withAdmin';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [resolving, setResolving] = useState(false);
  const [newEvidenceNote, setNewEvidenceNote] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/disputes');
      setDisputes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch disputes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const openDetail = async (dispute: any) => {
    setSelectedDispute(dispute);
    setResolution('');
    setAdminNotes('');
    setSplitPercentage(50);
    setNewEvidenceNote('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/disputes/${dispute.id}`);
      setDetailData(res.data);
    } catch (err) {
      console.error('Failed to fetch dispute detail', err);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution) { alert('Please select a resolution'); return; }
    setResolving(true);
    try {
      const payload: any = { resolution, adminNotes };
      if (resolution === 'split') payload.splitPercentage = splitPercentage;
      await api.patch(`/admin/disputes/${selectedDispute.id}/resolve`, payload);
      alert('Dispute resolved successfully.');
      setSelectedDispute(null);
      setDetailData(null);
      setResolution('');
      setAdminNotes('');
      setSplitPercentage(50);
      fetchDisputes();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!newEvidenceNote.trim()) return;
    try {
      await api.post(`/disputes/${selectedDispute.id}/evidence`, { note: newEvidenceNote });
      setNewEvidenceNote('');
      // Refresh detail
      const res = await api.get(`/disputes/${selectedDispute.id}`);
      setDetailData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to add evidence');
    }
  };

  const getMilestoneTitle = (d: any) => d.milestone?.title ? d.milestone.title : `Milestone #${d.milestone_id}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: FAUCET_EASING }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div className="eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, fontSize: '1.75rem' }}>Disputes</h1>
        </div>
        <motion.button onClick={fetchDisputes} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>🔄 Refresh</motion.button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="pl-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Milestone</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Raised By</th>
                <th>Deadline</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
              {disputes.map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.02 * i }} style={{ borderBottom: '1px solid var(--border)' }} whileHover={{ background: 'var(--accent-alpha)' }}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>#{d.id}</td>
                  <td>{getMilestoneTitle(d)}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason}</td>
                  <td><span className={`pl-badge ${d.status === 'open' ? 'pl-badge-warning' : d.status.startsWith('resolved') ? 'pl-badge-done' : 'pl-badge-open'}`}>{d.status.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{d.initiator?.profile?.full_name || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: d.response_deadline && new Date(d.response_deadline) < new Date() ? '#f87171' : '#34d399' }}>
                    {d.response_deadline ? new Date(d.response_deadline).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <motion.button onClick={() => openDetail(d)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {d.status === 'open' ? 'Resolve' : 'View'}
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
              {disputes.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--fg-tertiary)' }}>No disputes found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / Resolve Modal */}
      {selectedDispute && (
        <div className="modal-overlay" onClick={() => { setSelectedDispute(null); setDetailData(null); }}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelectedDispute(null); setDetailData(null); }}>✕</button>
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Dispute #{selectedDispute.id}
              {detailData?.isWithinResponseWindow !== undefined && (
                <span style={{ fontSize: '0.8rem', fontWeight: 400, marginLeft: '0.75rem', color: detailData.isWithinResponseWindow ? '#34d399' : '#f87171' }}>
                  {detailData.isWithinResponseWindow ? 'Within response window' : 'Past response deadline'}
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>{getMilestoneTitle(selectedDispute)} • Raised by {selectedDispute.initiator?.profile?.full_name || 'Unknown'}</p>

            {detailLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="pl-spinner" /></div>
            ) : (
              <div className="dispute-detail-layout">
                {/* Left panel: Evidence & Chat */}
                <div className="dispute-detail-panel">
                  {/* Reason */}
                  <div className="dispute-detail-block">
                    <h4>Reason</h4>
                    <p>{selectedDispute.reason}</p>
                  </div>

                  {/* Evidence */}
                  <div className="dispute-detail-block">
                    <h4>Evidence</h4>
                    {detailData?.evidence?.length > 0 ? (
                      <div className="evidence-list">
                        {detailData.evidence.map((ev: any) => (
                          <div key={ev.id} className="evidence-item">
                            <div className="evidence-item__header">
                              <strong>{ev.submitter?.profile?.full_name || 'User #' + ev.submitted_by}</strong>
                              <span>{new Date(ev.created_at).toLocaleString()}</span>
                            </div>
                            {ev.note && <p>{ev.note}</p>}
                            {ev.file_url && <a href={ev.file_url} target="_blank" rel="noopener" className="evidence-link">📎 View Attachment</a>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem' }}>No evidence submitted yet.</p>
                    )}

                    {/* Admin add evidence */}
                    {selectedDispute.status === 'open' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Add admin note as evidence..."
                          value={newEvidenceNote}
                          onChange={e => setNewEvidenceNote(e.target.value)}
                          style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: '0.85rem' }}
                        />
                        <button onClick={handleAddEvidence} className="pl-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>Add</button>
                      </div>
                    )}
                  </div>

                  {/* Chat History */}
                  {detailData?.chatHistory?.length > 0 && (
                    <div className="dispute-detail-block">
                      <h4>Chat History ({detailData.chatHistory.length} messages)</h4>
                      <div className="chat-preview">
                        {detailData.chatHistory.slice(-10).map((msg: any) => (
                          <div key={msg.id} className="chat-preview-msg">
                            <strong>{msg.sender?.profile?.full_name || 'User'}:</strong>
                            <span>{msg.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right panel: Resolution controls */}
                <div className="dispute-detail-panel dispute-detail-panel--resolve">
                  {selectedDispute.status === 'open' ? (
                    <>
                      <h4>Resolve Dispute</h4>
                      <div className="resolve-field">
                        <label>Resolution</label>
                        <select value={resolution} onChange={e => setResolution(e.target.value)}>
                          <option value="">Select resolution...</option>
                          <option value="refund_client">Refund Client (100%)</option>
                          <option value="release_provider">Release to Provider (100%)</option>
                          <option value="split">Split Payment</option>
                        </select>
                      </div>

                      {resolution === 'split' && (
                        <div className="resolve-field">
                          <label>Provider Share: {splitPercentage}%</label>
                          <input type="range" min={10} max={90} value={splitPercentage} onChange={e => setSplitPercentage(Number(e.target.value))} style={{ width: '100%' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--fg-secondary)' }}>
                            <span>Client gets {100 - splitPercentage}%</span>
                            <span>Provider gets {splitPercentage}%</span>
                          </div>
                        </div>
                      )}

                      <div className="resolve-field">
                        <label>Admin Notes</label>
                        <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Optional notes about the resolution..." />
                      </div>

                      <button onClick={handleResolve} disabled={resolving || !resolution} className="pl-btn pl-btn-primary" style={{ width: '100%', opacity: !resolution ? 0.5 : 1 }}>
                        {resolving ? 'Resolving...' : 'Resolve Dispute'}
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <p style={{ color: '#34d399', fontWeight: 600, fontSize: '1rem' }}>✅ Resolved</p>
                      <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Status: {selectedDispute.status.replace(/_/g, ' ')}
                        {selectedDispute.split_percentage && <><br/>Split: Provider got {selectedDispute.split_percentage}%</>}
                      </p>
                      {selectedDispute.admin_notes && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.85rem', textAlign: 'left' }}>
                          <strong>Admin Notes:</strong> {selectedDispute.admin_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 0.65rem 0.85rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
        .admin-table th { font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; position: sticky; top: 0; background: var(--bg); }
        .admin-table tbody tr:hover { background: var(--surface-hover); }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 100;
          padding: 2rem 1rem;
          overflow-y: auto;
        }
        .modal-content {
          background: var(--surface);
          border-radius: var(--radius);
          padding: 1.5rem;
          max-width: 500px;
          width: 100%;
          position: relative;
          margin-top: 5vh;
          border: 1px solid var(--border);
        }
        .modal-content--wide {
          max-width: 800px;
        }
        .modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: none;
          border: none;
          color: var(--fg-tertiary);
          font-size: 1.25rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .modal-close:hover {
          background: var(--surface-hover);
          color: var(--fg);
        }
        .dispute-detail-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .dispute-detail-panel,
        .dispute-detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .dispute-detail-block h4 {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--fg-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.5rem;
        }
        .dispute-detail-block p {
          font-size: 0.9rem;
          color: var(--fg);
          background: var(--surface-hover);
          padding: 0.75rem;
          border-radius: var(--radius);
        }
        .evidence-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .evidence-item {
          padding: 0.75rem;
          background: var(--surface-hover);
          border-radius: var(--radius);
        }
        .evidence-item__header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          font-size: 0.8rem;
        }
        .evidence-item__header strong { color: var(--fg); }
        .evidence-item__header span { color: var(--fg-tertiary); }
        .evidence-item p { font-size: 0.85rem; color: var(--fg); margin: 0; }
        .evidence-link {
          font-size: 0.82rem;
          color: var(--accent);
          text-decoration: none;
          margin-top: 0.25rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        @media (max-width: 768px) {
          .dispute-detail-layout {
            grid-template-columns: 1fr;
          }
        }
        .chat-preview { display: flex; flex-direction: column; gap: 0.35rem; max-height: 200px; overflow-y: auto; padding: 0.5rem; background: var(--surface-hover); border-radius: var(--radius); }
        .chat-preview-msg { font-size: 0.82rem; }
        .chat-preview-msg strong { color: var(--primary); margin-right: 0.35rem; }
        .chat-preview-msg span { color: var(--fg); }
        .resolve-field { margin-bottom: 0.75rem; }
        .resolve-field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--muted); }
        .resolve-field select, .resolve-field textarea { width: 100%; padding: 0.5rem 0.6rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--surface); color: var(--fg); font-size: 0.85rem; font-family: inherit; }
        .resolve-field textarea { resize: vertical; }
      `}</style>
    </motion.div>
  );
}

export default withAdmin(AdminDisputesPage);
