'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        const response = await api.get(`/jobs/my-jobs?_t=${Date.now()}`);
        setJobs(response.data.jobs || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  if (loading) return (
    <div className="page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <motion.div
          className="dash-banner dash-banner--client"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <div className="dash-banner__eyebrow">Your postings</div>
            <h1 className="dash-banner__name">My posted jobs</h1>
          </div>
          <Link href="/jobs/new" className="btn btn-copper btn-sm" style={{ borderRadius: 999 }}>
            + Post a job
          </Link>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {jobs.length > 0 ? (
              jobs.map((job: any, i) => {
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 * i, ease: FAUCET_EASING }}
                  >
                    <Link href={`/jobs/${job.id}`} className="job-row">
                      <div className="job-row__dot" style={{ background: job.status === 'open' ? 'var(--success)' : 'var(--info)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="job-row__title">{job.title}</div>
                        <div className="job-row__meta">
                          Posted {new Date(job.posted_at).toLocaleDateString()} · {job.bid_count || 0} bid{(job.bid_count || 0) !== 1 ? 's' : ''} received
                        </div>
                      </div>
                      <div className={'badge ' + (job.status === 'open' ? 'badge-success' : job.status === 'in_progress' || job.status === 'assigned' ? 'badge-info' : 'badge-neutral')}>
                        {job.status?.replace('_', ' ')}
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-title">No jobs posted yet</div>
                <div className="empty-state-desc">You haven't posted any jobs. Create one to get started.</div>
                <Link href="/jobs/new" className="btn btn-copper btn-sm">Post your first job</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default withAuth(MyJobsPage);
