import { useState } from 'react';
import api from '../lib/api';

export default function DisputeModal({ milestoneId, onClose, onSuccess }: any) {
  const [reason, setReason] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/disputes', { milestoneId, reason });
      // Attach initial evidence if provided
      if (evidenceNote.trim() || fileUrl.trim()) {
        await api.post(`/disputes/${res.data.id}/evidence`, { note: evidenceNote, fileUrl: fileUrl || undefined });
      }
      onSuccess();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.msg || 'Failed to submit dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div className="glass" style={s.modal}>
        <div style={s.header}>
          <h2 style={{ fontSize: '1.25rem', color: '#f1f5f9', margin: 0 }}>Raise a Dispute</h2>
          <button onClick={onClose} style={s.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Disputing a project stage halts the release of funds and brings an admin in to review the situation. 
            Please explain the issue clearly and attach any supporting evidence.
          </p>

          {errorMsg && <div style={s.errorBox}>{errorMsg}</div>}

          <div>
            <label className="pl-label">Reason for Dispute *</label>
            <textarea
              required
              rows={3}
              placeholder="Explain why you are disputing this project stage..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="pl-input"
            />
          </div>

          <div>
            <label className="pl-label">Evidence Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Add any supporting details or context..."
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              className="pl-input"
            />
          </div>

          <div>
            <label className="pl-label">Attachment URL (optional)</label>
            <input
              type="text"
              placeholder="https://example.com/screenshot.png"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="pl-input"
            />
          </div>

          <button type="submit" disabled={submitting} className="pl-btn pl-btn-primary" style={{ width: '100%', marginTop: '0.5rem', backgroundColor: '#ef4444', color: 'white' }}>
            {submitting ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '100%', maxWidth: 500, borderRadius: '12px', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }
};
