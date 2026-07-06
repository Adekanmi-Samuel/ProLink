import { useState, useEffect } from 'react';
import api from '../lib/api';
import DisputeModal from './DisputeModal';

export default function MilestonesSection({ jobId, isOwner, isAssignedProvider, onCompleteJob }: any) {
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [disputeStageId, setDisputeStageId] = useState<number | null>(null);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [revisionStageId, setRevisionStageId] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const fetchStages = async () => {
    try {
      const response = await api.get(`/milestones/job/${jobId}`);
      setStages(response.data);
    } catch (error) {
      console.error('Failed to fetch project stages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, [jobId]);

  const handleCreateStage = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/milestones', { jobId, title: newTitle, amount: newAmount });
      setNewTitle('');
      setNewAmount('');
      setShowForm(false);
      fetchStages();
    } catch (error: any) {
      alert('Failed to create stage: ' + (error.response?.data?.msg || 'Error'));
    }
  };

  const handleFund = async (id: number) => {
    try {
      await api.post('/payments/mock-fund', { milestoneId: id });
      alert('Payment successful! Funds are now held safely in escrow.');
      fetchStages();
    } catch (error: any) {
      alert('Failed to fund stage: ' + (error.response?.data?.msg || 'Error'));
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await api.patch(`/milestones/${id}/submit`);
      fetchStages();
    } catch (error: any) {
      alert('Failed to submit work: ' + (error.response?.data?.msg || 'Error'));
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this stage and release the payment to the provider?')) return;
    try {
      await api.patch(`/milestones/${id}/approve`);
      alert('Milestone approved and payment released!');
      fetchStages();
    } catch (error: any) {
      const msg = error.response?.data?.msg || 'Failed to approve stage.';
      if (error.response?.status === 207) {
        alert(msg + ' Please contact support to resolve the payout.');
      } else {
        alert(msg);
      }
      fetchStages();
    }
  };

  const handleRequestRevision = async (id: number) => {
    if (!revisionNotes.trim()) {
      alert('Please enter revision notes for the provider.');
      return;
    }
    try {
      await api.patch(`/milestones/${id}/request-revision`, { notes: revisionNotes });
      setRevisionStageId(null);
      setRevisionNotes('');
      fetchStages();
    } catch (error: any) {
      alert('Failed to request revision: ' + (error.response?.data?.msg || 'Error'));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Payment';
      case 'funded': return 'Paid ✅ In Escrow';
      case 'submitted': return 'Work Submitted';
      case 'approved': return 'Approved';
      case 'paid': return 'Completed ✅';
      case 'revision_requested': return 'Revision Requested 🔄';
      case 'disputed': return 'Disputed ⚖️';
      case 'refunded': return 'Refunded';
      case 'split': return 'Split Payment';
      default: return status.toUpperCase();
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'funded': return 'pl-badge-assigned';
      case 'paid': case 'approved': return 'pl-badge-done';
      case 'submitted': return 'pl-badge-warning';
      case 'revision_requested': return 'pl-badge-warning';
      case 'disputed': return 'pl-badge-open';
      default: return 'pl-badge-open';
    }
  };

  if (loading) return <div style={{ color: 'var(--fg-secondary)', padding: '1rem 0' }}>Loading project stages...</div>;

  return (
    <div className="stages-section">
      <div className="stages-section__header">
        <div className="stages-section__title-wrap">
          <h2 className="stages-section__title">Project Stages & Escrow</h2>
          <button 
            onClick={() => setShowInfoPopup(!showInfoPopup)} 
            className="stages-section__info-btn"
            title="How does this work?"
          >
            ?
          </button>
        </div>
        {isOwner && (
          <button onClick={() => setShowForm(!showForm)} className="pl-btn pl-btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            + Add Stage
          </button>
        )}
      </div>

      {/* Info Popup */}
      {showInfoPopup && (
        <div className="stages-info-popup">
          <h4>How Project Stages Work</h4>
          <div className="stages-info-steps">
            <div className="stages-info-step">
              <span className="stages-info-step__num">1</span>
              <div>
                <strong>Client creates stages</strong>
                <p>Break the project into parts (e.g., "Logo Design", "Website Layout", "Final Files").</p>
              </div>
            </div>
            <div className="stages-info-step">
              <span className="stages-info-step__num">2</span>
              <div>
                <strong>Client pays for each stage</strong>
                <p>Money goes into a secure escrow - not directly to the provider yet.</p>
              </div>
            </div>
            <div className="stages-info-step">
              <span className="stages-info-step__num">3</span>
              <div>
                <strong>Provider does the work</strong>
                <p>When the provider finishes a stage, they click "Submit Work".</p>
              </div>
            </div>
            <div className="stages-info-step">
              <span className="stages-info-step__num">4</span>
              <div>
                <strong>Client approves & releases payment</strong>
                <p>If satisfied, the client approves and the money is released to the provider.</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowInfoPopup(false)} className="pl-btn pl-btn-ghost" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Got it ✓</button>
        </div>
      )}

      {showForm && isOwner && (
        <form onSubmit={handleCreateStage} className="stages-section__form">
          <input type="text" placeholder="Stage name (e.g., Logo Draft)" required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="pl-input" style={{ flex: 2 }} />
          <input type="number" placeholder="Amount (&#x20A6;)" required value={newAmount} onChange={e => setNewAmount(e.target.value)} className="pl-input" style={{ flex: 1 }} />
          <button type="submit" className="pl-btn pl-btn-primary">Add</button>
        </form>
      )}

      {stages.length === 0 ? (
        <p className="stages-section__empty">
          {isOwner 
            ? 'No stages created yet. Add your first stage to start splitting the project into manageable parts.' 
            : 'Waiting for the client to create project stages.'}
        </p>
      ) : (
        <div className="stages-section__list">
          {stages.map((m, idx) => (
            <div key={m.id} className="stage-card">
              <div className="stage-card__left">
                <span className="stage-card__number">{idx + 1}</span>
                <div>
                  <h3 className="stage-card__title">{m.title}</h3>
                  <div className="stage-card__meta">
                    <span className="stage-card__amount">&#x20A6;{Number(m.amount).toLocaleString()}</span>
                    <span style={{ color: 'var(--fg-secondary)', fontSize: '0.8rem' }}>·</span>
                    <span className={`pl-badge ${getStatusBadgeClass(m.status)}`}>
                      {getStatusLabel(m.status)}
                    </span>
                    {m.revision_notes && (
                      <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '0.5rem', cursor: 'pointer' }} 
                            title={m.revision_notes}>📝 has notes</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="stage-card__actions">
                {isOwner && m.status === 'pending' && (
                  <button onClick={() => handleFund(m.id)} className="pl-btn pl-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Pay into Escrow</button>
                )}
                {isAssignedProvider && m.status === 'funded' && (
                  <button onClick={() => handleSubmit(m.id)} className="pl-btn pl-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Submit Work</button>
                )}
                {isAssignedProvider && m.status === 'revision_requested' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                    {m.revision_notes && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', maxWidth: '250px', textAlign: 'right' }}>
                        Client: {m.revision_notes}
                      </div>
                    )}
                    <button onClick={() => handleSubmit(m.id)} className="pl-btn pl-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'var(--warning)', color: 'var(--bg)' }}>
                      Resubmit Work
                    </button>
                  </div>
                )}
                {isOwner && m.status === 'submitted' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleApprove(m.id)} className="pl-btn pl-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'var(--success)', color: 'var(--bg)' }}>Approve & Pay</button>
                    <button onClick={() => setRevisionStageId(m.id)} className="pl-btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--warning)', border: '1px solid var(--warning)', background: 'transparent', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                      Request Revision
                    </button>
                  </div>
                )}
                {(m.status === 'funded' || m.status === 'submitted' || m.status === 'revision_requested') && (
                  <button onClick={() => setDisputeStageId(m.id)} className="pl-btn pl-btn-ghost" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--danger)' }}>Dispute</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggest completing the job if all stages are done */}
      {isOwner && stages.length > 0 && stages.every(m => m.status === 'paid' || m.status === 'approved' || m.status === 'split' || m.status === 'refunded') && (
        <div className="stages-section__complete">
          <p>All stages are complete! You can now mark the job as finished.</p>
          <button onClick={onCompleteJob} className="pl-btn pl-btn-primary">✓ Complete Job</button>
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionStageId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: '100%', maxWidth: 480, borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--fg)', margin: 0 }}>Request Revision</h2>
              <button onClick={() => { setRevisionStageId(null); setRevisionNotes(''); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--fg-secondary)', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Let the provider know what needs to be changed before you can approve this milestone.
              </p>
              <div>
                <label className="pl-label">Revision Notes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what needs to be changed..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="pl-input"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setRevisionStageId(null); setRevisionNotes(''); }} className="pl-btn">Cancel</button>
                <button onClick={() => handleRequestRevision(revisionStageId)} className="pl-btn pl-btn-primary" style={{ background: 'var(--warning)', color: 'var(--bg)' }}>
                  Request Revision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {disputeStageId && (
        <DisputeModal 
          milestoneId={disputeStageId}
          onClose={() => setDisputeStageId(null)}
          onSuccess={() => {
            setDisputeStageId(null);
            fetchStages();
            alert('Dispute submitted successfully.');
          }}
        />
      )}

      <style>{`
        .stages-section {
          margin-top: 2rem;
        }
        .stages-section__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .stages-section__title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stages-section__title {
          font-size: 1.25rem;
          color: var(--fg);
          font-weight: 700;
          margin-bottom: 0;
        }
        .stages-section__info-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid var(--fg-secondary);
          background: transparent;
          color: var(--fg-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .stages-section__info-btn:hover {
          background: var(--fg-secondary);
          color: var(--bg);
        }
        .stages-section__form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: var(--surface-hover);
          border-radius: 10px;
        }
        .stages-section__empty {
          color: var(--fg-secondary);
          font-size: 0.9rem;
          padding: 2rem 1rem;
          text-align: center;
          background: var(--surface-hover);
          border-radius: 10px;
        }
        .stages-section__list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .stages-section__complete {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stages-section__complete p { color: #34d399; font-size: 0.9rem; font-weight: 600; margin: 0; }
        
        .stages-info-popup {
          margin-bottom: 1rem;
          padding: 1.25rem;
          background: var(--surface-hover);
          border-radius: 10px;
        }
        .stages-info-popup h4 { margin: 0 0 0.75rem 0; font-size: 0.95rem; color: var(--fg); }
        .stages-info-steps {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .stages-info-step {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .stages-info-step__num {
          width: 24px;
          height: 24px;
          min-width: 24px;
          border-radius: 50%;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-fg);
        }
        .stages-info-step div { flex: 1; }
        .stages-info-step strong { font-size: 0.85rem; color: var(--fg); }
        .stages-info-step p { margin: 0; font-size: 0.8rem; color: var(--fg-secondary); }
        
        .stage-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: all 0.2s;
        }
        .stage-card:hover {
          border-color: var(--fg-secondary);
          background: var(--surface-hover);
        }
        .stage-card__left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stage-card__number {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--surface-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--accent);
          flex-shrink: 0;
        }
        .stage-card__title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--fg);
          margin: 0;
        }
        .stage-card__meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.15rem;
        }
        .stage-card__amount {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--success);
        }
        .stage-card__actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
