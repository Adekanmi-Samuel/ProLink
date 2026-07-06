'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import withAuth from '../../../../components/withAuth';
import Link from 'next/link';

function ContractWorkspace() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Milestone Form State
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Review Form State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [jobRes, userRes, milestoneRes] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get('/profiles/me'),
          api.get(`/milestones/job/${id}`)
        ]);
        
        setJob(jobRes.data);
        setUser(userRes.data);
        setMilestones(milestoneRes.data || []);
      } catch (err) {
        console.error('Failed to load workspace data', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchAll();
      const interval = setInterval(fetchAll, 15000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const refreshMilestones = async () => {
    try {
      const res = await api.get(`/milestones/job/${id}`);
      setMilestones(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const isClient = user?.id === job?.client_id;
  const isProvider = user?.id === job?.assignment?.provider_id;
  const otherUserName = isClient 
    ? job?.assignment?.provider?.profile?.full_name 
    : job?.client_name;

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/milestones', {
        jobId: parseInt(id),
        title: milestoneDesc, // Backend expects 'title'
        amount: parseFloat(milestoneAmount)
      });
      setShowAddMilestone(false);
      setMilestoneDesc('');
      setMilestoneAmount('');
      refreshMilestones();
    } catch (err) {
      alert('Failed to add milestone. Ensure you have sufficient balance to fund it.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitMilestone = async (mId: number) => {
    setActionLoading(true);
    try {
      await api.patch(`/milestones/${mId}/submit`);
      refreshMilestones();
    } catch (err) {
      alert('Failed to submit milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestone = async (mId: number) => {
    setActionLoading(true);
    try {
      await api.patch(`/milestones/${mId}/approve`);
      refreshMilestones();
    } catch (err) {
      alert('Failed to approve milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFundMilestone = async (mId: number) => {
    setActionLoading(true);
    try {
      const res = await api.post('/payments/initialize', { milestoneId: mId });
      // Redirect to the Paystack authorization URL (or our mock page)
      window.location.href = res.data.authorization_url;
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to initialize payment.');
      setActionLoading(false);
    }
  };

  const handleDeleteMilestone = async (mId: number) => {
    if (!confirm('Are you sure you want to cancel and delete this milestone? Funds will be returned to your wallet.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/milestones/${mId}`);
      refreshMilestones();
    } catch (err) {
      alert('Failed to delete milestone.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispute = async (mId: number) => {
    const reason = prompt('Please explain the reason for opening a dispute:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.post('/disputes', { milestoneId: mId, reason });
      refreshMilestones();
      alert('Dispute opened. ProLink support will review it shortly.');
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to open dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Complete the job first, if it's not already completed
      if (job?.status !== 'completed') {
        await api.patch(`/jobs/${id}/complete`);
      }
      // Submit the review
      await api.post('/reviews', {
        jobId: parseInt(id),
        rating: rating,
        comment: reviewComment
      });
      // Reload page to reflect completion
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to submit review.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-center p-4"><div className="pl-spinner" /></div>;
  }

  if (!job) {
    return <div className="p-2">Workspace not found.</div>;
  }

  // Calculate totals
  const totalFunded = milestones.reduce((sum, m) => sum + (m.status !== 'pending' ? Number(m.amount) : 0), 0);
  const totalApproved = milestones.reduce((sum, m) => sum + (m.status === 'approved' ? Number(m.amount) : 0), 0);

  return (
    <div className="workspace fade-up">
      {/* Header */}
      <div className="workspace__header pl-card">
        <Link href="/dashboard/contracts" className="workspace__back">← Back to Contracts</Link>
        <div className="workspace__title-row">
          <h1 className="workspace__title">{job.title}</h1>
          <span className={`pl-badge ${job.status === 'completed' ? 'pl-badge-success' : 'pl-badge-neutral'}`}>
            {job.status === 'completed' ? 'Completed' : 'Active Contract'}
          </span>
        </div>
        <div className="workspace__meta">
          <p><strong>{isClient ? 'Freelancer' : 'Client'}:</strong> {otherUserName || 'ProLink User'}</p>
          <p><strong>Agreed Budget:</strong> &#x20A6;{Number(job.assignment?.agreed_amount || job.budget || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="workspace__grid">
        {/* Milestones Column */}
        <div className="workspace__main">
          <div className="workspace__section-header">
            <h2>Milestones & Payments</h2>
            <div className="flex-row gap-0\.5">
              {isClient && job.status !== 'completed' && (
                <button 
                  onClick={() => setShowReviewModal(true)} 
                  className="pl-btn pl-btn-secondary workspace-btn-sm"
                >
                  End Contract
                </button>
              )}
              {job.status === 'completed' && (
                <button 
                  onClick={() => setShowReviewModal(true)} 
                  className="pl-btn pl-btn-secondary workspace-btn-sm"
                >
                  ★ Leave Review
                </button>
              )}
              {isClient && job.status !== 'completed' && (
                <button 
                  onClick={() => setShowAddMilestone(!showAddMilestone)} 
                  className="pl-btn pl-btn-primary workspace-btn-sm"
                >
                  + Fund New Milestone
                </button>
              )}
            </div>
          </div>

          {showAddMilestone && (
            <form onSubmit={handleAddMilestone} className="pl-card workspace__form">
              <h3 className="mb-1 fs-0-85 h-punchy">Create Milestone</h3>
              <div className="flex-row gap-1 mb-1">
                <div className="pl-input-group flex-2">
                  <label>Description</label>
                  <input 
                    type="text" 
                    required 
                    className="pl-input" 
                    value={milestoneDesc} 
                    onChange={e => setMilestoneDesc(e.target.value)} 
                    placeholder="e.g. Initial Wireframes"
                  />
                </div>
                <div className="pl-input-group flex-1">
                  <label>Amount (&#x20A6;)</label>
                  <input 
                    type="number" 
                    required 
                    min="1000"
                    className="pl-input" 
                    value={milestoneAmount} 
                    onChange={e => setMilestoneAmount(e.target.value)} 
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex-end gap-0\.5">
                <button type="button" onClick={() => setShowAddMilestone(false)} className="pl-btn pl-btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="pl-btn pl-btn-primary">
                  {actionLoading ? 'Funding...' : 'Fund Milestone'}
                </button>
              </div>
            </form>
          )}

          <div className="workspace__milestones">
            {milestones.length === 0 ? (
              <div className="pl-card text-center p-2">
                No milestones have been created yet.
              </div>
            ) : (
              milestones.map((m) => (
                <div key={m.id} className="pl-card milestone-card">
                  <div className="milestone-card__info">
                    <h4 className="milestone-card__desc">{m.title}</h4>
                    <span className="milestone-card__amount">&#x20A6;{Number(m.amount).toLocaleString()}</span>
                  </div>
                  <div className="milestone-card__status-col">
                    <span className={`pl-badge ${
                      m.status === 'approved' ? 'pl-badge-success' : 
                      m.status === 'submitted' ? 'pl-badge-warning' : 'pl-badge-neutral'
                    }`}>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="milestone-card__actions">
                      {isClient && m.status === 'pending' && (
                        <button 
                          onClick={() => handleFundMilestone(m.id)}
                          disabled={actionLoading}
                          className="pl-btn pl-btn-primary workspace-btn-xs btn-pay"
                        >
                          Pay to Fund
                        </button>
                      )}
                      {isClient && (m.status === 'funded' || m.status === 'pending') && (
                        <button 
                          onClick={() => handleDeleteMilestone(m.id)}
                          disabled={actionLoading}
                          className="pl-btn pl-btn-secondary workspace-btn-xs btn-cancel"
                        >
                          Cancel
                        </button>
                      )}
                      {isProvider && m.status === 'funded' && (
                        <button 
                          onClick={() => handleSubmitMilestone(m.id)}
                          disabled={actionLoading}
                          className="pl-btn pl-btn-primary workspace-btn-xs"
                        >
                          Submit Work
                        </button>
                      )}
                      {isClient && m.status === 'submitted' && (
                        <button 
                          onClick={() => handleApproveMilestone(m.id)}
                          disabled={actionLoading}
                          className="pl-btn pl-btn-primary workspace-btn-xs btn-approve-pay"
                        >
                          Approve & Release
                        </button>
                      )}
                      {(m.status === 'funded' || m.status === 'submitted') && (
                        <button 
                          onClick={() => handleOpenDispute(m.id)}
                          disabled={actionLoading}
                          className="pl-btn pl-btn-secondary workspace-btn-xs btn-dispute"
                          title="Escalate to Support"
                        >
                          Dispute
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="workspace__sidebar">
          <div className="pl-card workspace-stats">
            <h3 className="workspace-stats__title">Financial Overview</h3>
            <div className="workspace-stats__item">
              <span>Total Agreed</span>
              <span>&#x20A6;{Number(job.assignment?.agreed_amount || job.budget || 0).toLocaleString()}</span>
            </div>
            <div className="workspace-stats__item">
              <span>Funded Milestones</span>
              <span>&#x20A6;{totalFunded.toLocaleString()}</span>
            </div>
            <div className="workspace-stats__item mt-0\.5">
              <span className="fw-7">Paid Out</span>
              <span className="fw-8">&#x20A6;{totalApproved.toLocaleString()}</span>
            </div>
          </div>
          
          <Link href="/dashboard/messages" className="pl-btn pl-btn-secondary w-full text-center mt-1 flex-center">
            Message {otherUserName || 'User'}
          </Link>
        </div>
      </div>

      <style>{`
        .workspace { max-width: 1000px; }
        
        .workspace__header {
          padding: 1.5rem 2rem;
          margin-bottom: 2rem;
        }
        .workspace__back {
          display: inline-block;
          font-size: 0.85rem;
          color: var(--muted);
          text-decoration: none;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }
        .workspace__back:hover { color: var(--fg); }
        
        .workspace__title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .workspace__title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
        }
        .workspace__meta {
          display: flex;
          gap: 2rem;
          color: var(--muted);
          font-size: 0.95rem;
        }

        .workspace__grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
          align-items: flex-start;
        }
        
        .workspace__section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .workspace__section-header h2 {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--fg);
        }

        .workspace__form {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          background: var(--surface2);
          border: 1px dashed var(--border);
        }

        .workspace__milestones {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .milestone-card {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .milestone-card__info {
          flex: 1;
        }
        .milestone-card__desc {
          font-weight: 600;
          color: var(--fg);
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .milestone-card__amount {
          font-family: var(--font-outfit), sans-serif;
          font-size: 0.95rem;
          color: var(--primary);
          font-weight: 700;
        }
        .milestone-card__status-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.75rem;
        }
        .milestone-card__actions {
          display: flex;
          gap: 0.5rem;
        }

        .workspace-stats {
          padding: 1.5rem;
        }
        .workspace-stats__title {
          font-weight: 700;
          color: var(--fg);
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
        }
        .workspace-stats__item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .workspace-stats__item span:last-child {
          font-weight: 600;
          color: var(--fg);
        }

        @media (max-width: 768px) {
          .workspace__grid {
            grid-template-columns: 1fr;
          }
          .workspace__meta {
            flex-direction: column;
            gap: 0.5rem;
          }
          .milestone-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .milestone-card__status-col {
            align-items: flex-start;
            width: 100%;
          }
        }
        
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--surface);
          padding: 2rem;
          border-radius: var(--radius-lg);
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .star-rating {
          display: flex;
          gap: 0.5rem;
          font-size: 2rem;
          cursor: pointer;
        }
        .star {
          color: #d1d5db;
          transition: color 0.2s;
        }
        .star.filled {
          color: #f59e0b;
        }
      `}</style>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content fade-up">
            <h2 className="mb-1">
              {job?.status === 'completed' ? 'Leave a Review' : 'End Contract & Review'}
            </h2>
            <p className="fs-0-9 mb-1\.5">
              {job?.status === 'completed' 
                ? `Please leave a review for your experience with ${otherUserName || 'this user'}.` 
                : 'Are you sure you want to end this contract? Please leave a review for the provider.'}
            </p>
            <form onSubmit={handleEndContract}>
              <div className="mb-1">
                <label className="block mb-0\.5 fw-6">Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(num => (
                    <span 
                      key={num} 
                      className={`star ${rating >= num ? 'filled' : ''}`}
                      onClick={() => setRating(num)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="pl-input-group mb-1\.5">
                <label>Feedback (Optional)</label>
                <textarea 
                  className="pl-input" 
                  rows={4}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share your experience working with this provider..."
                />
              </div>
              <div className="flex-end gap-1">
                <button type="button" onClick={() => setShowReviewModal(false)} className="pl-btn pl-btn-secondary" disabled={actionLoading}>Cancel</button>
                <button type="submit" className="pl-btn pl-btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'End Contract & Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ContractWorkspace);
