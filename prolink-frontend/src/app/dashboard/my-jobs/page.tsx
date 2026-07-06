'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

const STAMP_COLORS = {
  open: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e' },
  assigned: { bg: 'rgba(59,130,246,0.12)', c: '#3b82f6' },
  completed: { bg: 'rgba(107,114,128,0.12)', c: '#6b7280' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', c: '#ef4444' },
};

function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        const response = await api.get('/jobs/my-jobs');
        setJobs(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Your postings</div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>My posted jobs</h1>
        </div>
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          <Link href="/jobs/new" className="btn btn-accent" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>+</span> Post a job
          </Link>
        </motion.div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {jobs.length > 0 ? (
            jobs.map((job, i) => {
              const statusStyle = STAMP_COLORS[job.status] || STAMP_COLORS.open;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.04 * i, ease: FAUCET_EASING }}
                  whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                  className="card glass"
                  style={{ padding: '1.5rem' }}
                >
                  <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--fg)' }}>{job.title}</h2>
                      <motion.span
                        style={{
                          display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 99,
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.04em', background: statusStyle.bg, color: statusStyle.c,
                        }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {job.status}
                      </motion.span>
                    </div>
                    <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Posted on {new Date(job.posted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div style={{
                      marginTop: '0.85rem', fontSize: '0.85rem', fontWeight: 600,
                      color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span>{job.bid_count || 0}</span> bid{(job.bid_count || 0) !== 1 ? 's' : ''} received
                    </div>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              className="card"
              style={{ padding: '3rem', textAlign: 'center' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p style={{ color: 'var(--fg-tertiary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>You haven&apos;t posted any jobs yet.</p>
              <Link href="/jobs/new" className="btn btn-accent">Post your first job</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default withAuth(MyJobsPage);
