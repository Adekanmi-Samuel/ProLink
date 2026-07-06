'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import Link from 'next/link';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

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
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
        }}
      />
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
    <motion.div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '0.85rem 1.25rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minWidth: 80, borderTop: `2px solid ${color}`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.span
        style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--fg)' }}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {count}
      </motion.span>
      <span style={{ fontSize: '0.72rem', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
        {label}
      </span>
    </motion.div>
  );

  return (
    <motion.div
      style={{ maxWidth: 960 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>My Proposals</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Track and manage all your submitted proposals
        </p>
      </div>

      <motion.div
        style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <StatCard label="Total" count={bids.length} color="var(--accent)" />
        <StatCard label="Pending" count={pending.length} color="#eab308" />
        <StatCard label="Accepted" count={accepted.length} color="#22c55e" />
        <StatCard label="Not Selected" count={rejected.length} color="#ef4444" />
      </motion.div>

      {bids.length > 0 ? (
        <motion.div
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="pl-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }}>Job</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }}>Submitted</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }}>Your Bid</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {bids.map((bid: any, i: number) => (
                    <motion.tr
                      key={bid.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.03 * i, ease: FAUCET_EASING }}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      whileHover={{ background: 'var(--accent-alpha)' }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Link href={`/jobs/${bid.job.id}`} style={{ fontWeight: 600, color: 'var(--fg)', textDecoration: 'none' }}>
                          {bid.job.title}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                          {bid.job.client_name} • Budget: ₦{Number(bid.job.budget || 0).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--fg-secondary)', fontSize: '0.85rem' }}>
                        {new Date(bid.submitted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, color: 'var(--fg)' }}>
                          ₦{Number(bid.amount).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusBadge status={bid.status} />
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link href={`/jobs/${bid.job.id}`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>
                            View →
                          </Link>
                          {bid.status === 'pending' && (
                            <motion.button
                              onClick={() => handleWithdraw(bid.job.id)}
                              style={{ fontSize: '0.82rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Withdraw
                            </motion.button>
                          )}
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
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span style={{ fontSize: '2.5rem' }}>📝</span>
          <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.9rem' }}>You haven&apos;t submitted any proposals yet.</p>
          <Link href="/jobs" className="btn btn-accent">Browse Open Jobs</Link>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const variants = {
    pending: { bg: 'rgba(234,179,8,0.12)', c: '#eab308', label: 'Pending' },
    accepted: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e', label: 'Accepted' },
    rejected: { bg: 'rgba(239,68,68,0.12)', c: '#ef4444', label: 'Not Selected' },
  };
  const v = variants[status] || variants.pending;
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
}

export default withAuth(MyBidsPage);
