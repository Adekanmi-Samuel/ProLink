'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import Link from 'next/link';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await api.get('/jobs/my-jobs');
        const activeContracts = (response.data?.jobs || []).filter((job: any) =>
          job.status === 'assigned' || job.status === 'completed'
        );
        setContracts(activeContracts);
      } catch (error) {
        console.error('Failed to fetch contracts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
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

  return (
    <motion.div
      style={{ maxWidth: 960 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: FAUCET_EASING }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>Active Contracts</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Manage your ongoing projects
        </p>
      </div>

      {contracts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {contracts.map((job: any, i: number) => (
              <motion.div
                key={job.id}
                className="card glass"
                style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * i, ease: FAUCET_EASING }}
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <motion.span
                      style={{
                        display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999,
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: job.status === 'completed' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                        color: job.status === 'completed' ? '#22c55e' : '#eab308',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      {job.status === 'completed' ? 'Completed' : 'In Progress'}
                    </motion.span>
                    <span
                      style={{
                        display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999,
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: 'rgba(107,114,128,0.1)', color: '#6b7280',
                      }}
                    >
                      {job.job_type === 'fixed' ? 'Fixed' : 'Milestones'}
                    </span>
                  </div>
                  <Link href={`/dashboard/contracts/${job.id}`} style={{
                    fontFamily: 'var(--font-heading), sans-serif', fontSize: '1.05rem',
                    fontWeight: 700, color: 'var(--fg)', display: 'block', marginBottom: '0.4rem',
                    textDecoration: 'none',
                  }}>
                    {job.title}
                  </Link>
                  <p style={{ fontSize: '0.85rem', color: 'var(--fg-tertiary)', lineHeight: 1.5, marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {job.description}
                  </p>
                  <div>
                    <span style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>
                      ₦{Number(job.budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Link
                    href={`/dashboard/contracts/${job.id}`}
                    className="btn btn-accent"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                  >
                    View Workspace →
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span style={{ fontSize: '2.5rem' }}>🤝</span>
          <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.9rem' }}>No active contracts right now.</p>
          <Link href="/dashboard/my-bids" className="btn btn-outline">Check Pending Bids</Link>
        </motion.div>
      )}
    </motion.div>
  );
}

export default withAuth(ContractsPage);
