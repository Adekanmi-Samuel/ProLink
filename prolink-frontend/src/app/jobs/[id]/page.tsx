'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import ReviewModal from '../../../components/ReviewModal';
import MilestonesSection from '../../../components/MilestonesSection';
import { useSocket } from '../../../lib/SocketContext';

const COLORS = ['#00D68F', '#4A8CFF', '#E8633C', '#F0B429', '#A78BFA', '#F472B6', '#14B8A6'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || 'A').length; i++) hash = (name || 'A').charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { socket } = useSocket();

  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [bidForm, setBidForm] = useState({ amount: '', estimatedTime: '', proposal: '' });
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data } = await api.get('/profiles/me');
        setCurrentUserId(data.user_id);
      } catch {
        setCurrentUserId(null);
      }
    };
    getCurrentUser();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJobData(response.data);
    } catch (error) {
      console.error('Failed to fetch job data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleNewBid = (bid: any) => {
      if (bid.job_id !== Number(id)) return;
      setJobData((prev: any) => {
        if (!prev) return prev;
        if (prev.bids?.some((b: any) => b.id === bid.id)) return prev;
        return { ...prev, bids: [bid, ...(prev.bids || [])] };
      });
    };

    const handleJobUpdated = (data: any) => {
      if (data.jobId !== Number(id)) return;
      setJobData((prev: any) => {
        if (!prev) return prev;
        return { ...prev, status: data.status };
      });
    };

    socket.on('new_bid', handleNewBid);
    socket.on('job_updated', handleJobUpdated);

    return () => {
      socket.off('new_bid', handleNewBid);
      socket.off('job_updated', handleJobUpdated);
    };
  }, [socket, id]);

  const isOwner = jobData && currentUserId !== null && jobData.client_id === currentUserId;
  const isAssignedToUser = jobData?.assignment?.provider_id === currentUserId;
  const showReviewButton = (isOwner || isAssignedToUser) && (jobData?.status === 'assigned' || jobData?.status === 'completed');

  const handleSaveJob = async () => {
    if (!currentUserId || !jobData) return;
    setSavingJob(true);
    try {
      if (jobData.isSaved) {
        await api.delete(`/saved_jobs/${jobData.id}`);
        setJobData((prev: any) => ({ ...prev, isSaved: false }));
      } else {
        await api.post('/saved_jobs', { jobId: jobData.id });
        setJobData((prev: any) => ({ ...prev, isSaved: true }));
      }
    } catch (error) {
      console.error('Failed to save/unsave job:', error);
    } finally {
      setSavingJob(false);
    }
  };

  const handleBidChange = (e: any) => setBidForm({ ...bidForm, [e.target.name]: e.target.value });

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBidSubmitting(true);
    if (parseFloat(bidForm.amount) < 500) {
      setErrorMsg('Minimum bid amount is ₦500.');
      setBidSubmitting(false);
      return;
    }
    try {
      const fullProposal = bidForm.estimatedTime
        ? `**Estimated Time:** ${bidForm.estimatedTime}\n\n${bidForm.proposal}`
        : bidForm.proposal;
      await api.post(`/jobs/${id}/bids`, { amount: bidForm.amount, proposal: fullProposal });
      setBidSubmitted(true);
      setBidForm({ amount: '', estimatedTime: '', proposal: '' });
    } catch (error: any) {
      const apiError = error.response?.data;
      if (apiError?.errors?.length > 0) {
        setErrorMsg(apiError.errors[0].message);
      } else {
        setErrorMsg(apiError?.msg || apiError?.error || 'Failed to submit. Please try again.');
      }
    } finally {
      setBidSubmitting(false);
    }
  };

  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedBidForHire, setSelectedBidForHire] = useState<any>(null);

  const handleContact = async (bid: any) => {
    try {
      const response = await api.post('/chats/initiate', { jobId: jobData.id, providerId: bid.provider_id });
      router.push(`/chat/${response.data.threadId}`);
    } catch { alert('Could not start conversation.'); }
  };

  const openHireModal = (bid: any) => {
    setSelectedBidForHire(bid);
    setHireModalOpen(true);
  };

  const confirmHire = async () => {
    if (!selectedBidForHire) return;
    try {
      await api.post(`/jobs/${id}/hire`, { providerId: selectedBidForHire.provider_id, agreedAmount: selectedBidForHire.amount });
      setHireModalOpen(false);
      fetchData();
    } catch (error: any) { alert('Failed: ' + (error.response?.data?.msg || 'Try again.')); }
  };

  const handleCompleteJob = async () => {
    if (!window.confirm('Mark this job as completed?')) return;
    try {
      await api.patch(`/jobs/${id}/complete`);
      fetchData();
    } catch (error: any) { alert('Failed: ' + (error.response?.data?.msg || 'Try again.')); }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${id}`);
      router.push('/dashboard/my-jobs');
    } catch (error: any) { alert('Failed to delete job: ' + (error.response?.data?.msg || 'Please try again.')); }
  };

  // Budget variance calculation
  const getBidVariance = (bidAmount: number) => {
    const budget = Number(jobData?.budget || 0);
    if (!budget) return null;
    const diff = bidAmount - budget;
    const pct = Math.round((Math.abs(diff) / budget) * 100);
    if (diff > 0) return { type: 'above', diff, pct, label: `+₦${diff.toLocaleString()} (${pct}% above budget)` };
    if (diff < 0) return { type: 'below', diff: Math.abs(diff), pct, label: `-₦${Math.abs(diff).toLocaleString()} (${pct}% below budget)` };
    return { type: 'exact', diff: 0, pct: 0, label: 'Matches budget exactly' };
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="spinner" />
          </motion.div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="page">
        <div className="wrap-sm" style={{ paddingTop: 'var(--space-3xl)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
            </div>
            <div className="empty-state-title">Job not found</div>
            <div className="empty-state-desc">This job may have been removed or the link is incorrect.</div>
            <Link href="/jobs" className="btn btn-outline btn-sm">Browse jobs</Link>
          </div>
        </div>
      </div>
    );
  }

  const bidVariance = bidForm.amount ? getBidVariance(Number(bidForm.amount)) : null;

  return (
    <div className="page">
      {/* ═══ CONTENT ═══ */}
      <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="job-detail-layout">
          {/* ── LEFT COLUMN: Job Info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            {/* Job header card */}
            <motion.div
              className="job-detail-header"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22,  1,  0.36,  1] as any }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <span className={'badge ' + (jobData.status === 'open' ? 'badge-success' : jobData.status === 'assigned' ? 'badge-warning' : 'badge-info')}>
                      {jobData.status?.replace('_', ' ')}
                    </span>
                    <span className="badge badge-neutral">
                      {jobData.job_type === 'fixed' ? 'Fixed Price' : 'Milestone'}
                    </span>
                    {isOwner && jobData.status === 'open' && (
                      <button 
                        onClick={handleDeleteJob} 
                        className="badge badge-neutral" 
                        style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', border: '1px solid rgba(220, 38, 38, 0.2)', cursor: 'pointer' }}
                        aria-label="Delete job"
                      >
                        🗑️ Delete Job
                      </button>
                    )}
                  </div>
                  <h1 className="job-detail-title">{jobData.title}</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="job-budget-display">
                    ₦{Number(jobData.budget || 0).toLocaleString()}
                  </div>
                  {!isOwner && (
                    <button
                      className={`job-card__save ${jobData.isSaved ? 'job-card__save--saved' : ''} ${savingJob ? 'job-card__save--removing' : ''}`}
                      onClick={handleSaveJob}
                      disabled={savingJob || !currentUserId}
                      aria-label={jobData.isSaved ? 'Remove from saved jobs' : 'Save job'}
                    >
                      {savingJob ? (
                        <span className="pl-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                      ) : jobData.isSaved ? (
                        '🔖'
                      ) : (
                        '🔖'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="job-detail-meta">
                <div className="job-detail-meta-item">
                  Posted by <strong style={{ color: 'var(--fg)', marginLeft: 4 }}>{jobData.client_name || 'Client'}</strong>
                </div>
                <span style={{ color: 'var(--border)' }}>·</span>
                <div className="job-detail-meta-item">{new Date(jobData.posted_at).toLocaleDateString()}</div>
                {jobData.location && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <div className="job-detail-meta-item">📍 {jobData.location}</div>
                  </>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '1.25rem 0' }} />

              <div style={{ fontSize: 'var(--text-base)', color: 'var(--fg-secondary)', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                {jobData.description}
              </div>

              {jobData.skills && jobData.skills.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Required Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {jobData.skills.map((s: any) => (
                      <span key={s.id} className="badge badge-neutral">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {showReviewButton && (
                <button onClick={() => setShowReviewModal(true)} className="btn btn-outline btn-sm" style={{ marginTop: '1.5rem' }}>
                  ★ Leave a Review
                </button>
              )}
            </motion.div>

            {/* Milestones */}
            {(jobData.status === 'assigned' || jobData.status === 'completed') && (
              <MilestonesSection jobId={jobData.id} isOwner={isOwner} isAssignedProvider={isAssignedToUser} onCompleteJob={handleCompleteJob} />
            )}
          </div>

          {/* ── RIGHT COLUMN: Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: 'calc(var(--navbar-h) + 1rem)' }}>
            {/* Client View: Bids Received */}
            {isOwner && (
              <motion.div
                className="bid-form-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <h3 className="bid-form-title">
                  Bids Received ({jobData.bids?.length || 0})
                </h3>
                {jobData.bids && jobData.bids.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {jobData.bids.map((bid: any) => {
                      const variance = getBidVariance(Number(bid.amount));
                      return (
                        <div key={bid.id} className="bid-card">
                          <div className="bid-card__header">
                            <div className="bid-card__avatar" style={{ background: avatarColor(bid.full_name) }}>
                              {(bid.full_name || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/profiles/${bid.provider_id}`} className="bid-card__name">
                                {bid.full_name || 'A Freelancer'}
                              </Link>
                              <div className="bid-card__location">Provider</div>
                              {variance && (
                                <div style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  marginTop: '0.2rem',
                                  color: variance.type === 'below' ? 'var(--success)' : variance.type === 'above' ? 'var(--warning)' : 'var(--info)',
                                }}>
                                  {variance.label}
                                </div>
                              )}
                            </div>
                            <div className="bid-card__amount">
                              ₦{Number(bid.amount).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bid-card__proposal">
                            {bid.proposal}
                          </div>
                          
                          <div className="bid-card__footer">
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <button
                                onClick={() => openHireModal(bid)}
                                disabled={jobData.status !== 'open'}
                                className="btn btn-accent btn-sm"
                                style={{ flex: 1 }}
                              >
                                {jobData.status === 'open' ? '✓ Hire Now' : 'Hired'}
                              </button>
                              <button onClick={() => handleContact(bid)} className="btn btn-surface btn-sm" style={{ flex: 1 }}>
                                💬 Message
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div className="empty-state-title" style={{ fontSize: 'var(--text-md)' }}>Waiting for bids...</div>
                    <div className="empty-state-desc">Bids will appear here as providers submit their proposals.</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Client Info (Provider View) */}
            {!isOwner && (
              <motion.div
                className="card-base"
                style={{ padding: '1.25rem' }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>About the Client</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `${avatarColor(jobData.client_name || 'Client')}20`,
                      color: avatarColor(jobData.client_name || 'Client'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'var(--text-sm)',
                    }}
                  >
                    {(jobData.client_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{jobData.client_name || 'Client'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>✓ Email Verified</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>✓ Payment Method Confirmed</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>✓ {jobData.client_jobs_count || 0} jobs posted</div>
                </div>
              </motion.div>
            )}

            {/* Bid Form (Provider View) */}
            {!isOwner && jobData.status === 'open' && (
              <motion.div
                className="bid-form-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <h3 className="bid-form-title">Submit a Proposal</h3>

                <div style={{
                  fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: '1.25rem',
                  padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}>
                  Client&apos;s budget: <strong style={{ color: 'var(--accent)' }}>₦{Number(jobData.budget || 0).toLocaleString()}</strong>
                  <br />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                    You can bid above or below this amount.
                  </span>
                </div>

                {bidSubmitted ? (
                  <div className="pl-alert pl-alert-success">✅ Proposal submitted successfully!</div>
                ) : (
                  <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {errorMsg && <div className="pl-alert pl-alert-error">{errorMsg}</div>}

                    <div className="field-group">
                      <label htmlFor="amount" className="field-label">Your Bid (₦)</label>
                      <input
                        id="amount" name="amount" type="number" required
                        className="field"
                        value={bidForm.amount}
                        onChange={handleBidChange}
                        placeholder="e.g. 50000"
                      />
                      {bidVariance && (
                        <div style={{
                          fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: '0.35rem',
                          padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          color: bidVariance.type === 'above' ? 'var(--warning)' : bidVariance.type === 'below' ? 'var(--success)' : 'var(--info)',
                          background: bidVariance.type === 'above' ? 'rgba(245, 158, 11, 0.1)' : bidVariance.type === 'below' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        }}>
                          {bidVariance.type === 'above' && '⬆ '}
                          {bidVariance.type === 'below' && '⬇ '}
                          {bidVariance.type === 'exact' && '✓ '}
                          {bidVariance.label}
                        </div>
                      )}
                    </div>

                    <div className="field-group">
                      <label htmlFor="estimatedTime" className="field-label">Estimated Delivery</label>
                      <input
                        id="estimatedTime" name="estimatedTime" type="text"
                        className="field"
                        value={bidForm.estimatedTime}
                        onChange={handleBidChange}
                        placeholder="e.g. 2 weeks"
                      />
                    </div>

                    <div className="field-group">
                      <label htmlFor="proposal" className="field-label">Cover Letter</label>
                      <textarea
                        id="proposal" name="proposal" rows={5} required
                        className="field"
                        value={bidForm.proposal}
                        onChange={handleBidChange}
                        placeholder="Why are you the best fit?"
                        style={{ minHeight: 120, resize: 'vertical' }}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={bidSubmitting}
                      className="btn btn-accent"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {bidSubmitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                          Submitting...
                        </span>
                      ) : 'Submit Proposal'}
                    </motion.button>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ REVIEW MODAL ═══ */}
      {showReviewModal && (
        <ReviewModal
          jobId={jobData.id}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => { setShowReviewModal(false); alert('Review submitted!'); }}
        />
      )}

      {/* ═══ HIRE MODAL ═══ */}
      <AnimatePresence>
        {hireModalOpen && selectedBidForHire && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHireModalOpen(false)}
          >
            <motion.div
              className="card-elevated"
              style={{ width: '100%', maxWidth: 420, padding: '2rem', margin: '1rem' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '0.75rem' }}>Confirm Hire</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Are you sure you want to hire <strong style={{ color: 'var(--fg)' }}>{selectedBidForHire.full_name || 'this provider'}</strong> for <strong style={{ color: 'var(--accent)' }}>₦{Number(selectedBidForHire.amount).toLocaleString()}</strong>?
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setHireModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={confirmHire} className="btn btn-accent" style={{ flex: 1 }}>Confirm Hire</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
