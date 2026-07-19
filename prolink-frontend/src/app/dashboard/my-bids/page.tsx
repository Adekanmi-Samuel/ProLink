'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import Link from 'next/link';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

function MyBidsPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await api.get('/jobs/my-bids');
        setBids(response.data.bids || []);
      } catch (error) {
        console.error('Failed to fetch bids', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
    const interval = setInterval(fetchBids, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>;
  }

  const handleWithdraw = async (jobId: number) => {
    if (!window.confirm('Withdraw this bid? This cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${jobId}/bids`);
      setBids(prev => prev.filter((b: any) => b.job.id !== jobId));
    } catch (err: any) {
      alert(err.response?.data?.msg || 'Failed to withdraw bid.');
    }
  };

  const pending = bids.filter((b: any) => b.status === 'pending');
  const accepted = bids.filter((b: any) => b.status === 'accepted');
  const rejected = bids.filter((b: any) => b.status === 'rejected');

  const StatCard = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <div className={`stat-card stat-card--${color}`} style={{ flex: 1, minWidth: 150 }}>
      <div className="stat-card__value">{count}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );

  return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <motion.div
          className="dash-banner dash-banner--provider"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
          style={{ marginBottom: '2rem' }}
        >
          <div className="dash-banner__eyebrow">Your Proposals</div>
          <h1 className="dash-banner__name">My Proposals</h1>
          <p className="dash-banner__sub">Track and manage all your submitted proposals</p>
        </motion.div>

        <motion.div
          style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <StatCard label="Total" count={bids.length} color="blue" />
          <StatCard label="Pending" count={pending.length} color="gold" />
          <StatCard label="Accepted" count={accepted.length} color="green" />
          <StatCard label="Not Selected" count={rejected.length} color="copper" />
        </motion.div>

        {bids.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {bids.map((bid: any, i: number) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.03 * i, ease: FAUCET_EASING }}
                  className="card-base"
                  style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <Link href={`/jobs/${bid.job.id}`} style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--fg)', textDecoration: 'none' }}>
                      {bid.job.title}
                    </Link>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginTop: '0.25rem' }}>
                      {bid.job.client_name} • Submitted: {new Date(bid.submitted_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', textTransform: 'uppercase' }}>Your Bid</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'var(--accent)', fontSize: 'var(--text-md)' }}>
                        ₦{Number(bid.amount).toLocaleString()}
                      </div>
                    </div>
                    
                    <StatusBadge status={bid.status} />

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/jobs/${bid.job.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                      {bid.status === 'pending' && (
                        <button
                          onClick={() => handleWithdraw(bid.job.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No proposals submitted yet</div>
            <div className="empty-state-desc">You haven't submitted any proposals. Browse open jobs to get started.</div>
            <Link href="/jobs" className="btn btn-accent btn-sm">Browse Open Jobs</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    pending: { bg: 'badge-warning', label: 'Pending' },
    accepted: { bg: 'badge-success', label: 'Accepted' },
    rejected: { bg: 'badge-danger', label: 'Not Selected' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={`badge ${v.bg}`}>
      {v.label}
    </span>
  );
}

export default withAuth(MyBidsPage);
