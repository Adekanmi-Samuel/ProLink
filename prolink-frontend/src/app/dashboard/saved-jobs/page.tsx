'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

export default function SavedJobsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  const [removingJobId, setRemovingJobId] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setError('');
      try {
        const response = await api.get('/saved_jobs');
        setSavedJobs(response.data?.savedJobs || []);
        setPagination(response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
      } catch (err) {
        console.error('Failed to load saved jobs', err);
        setError('We could not load your saved jobs right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // GSAP page enter animation
  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  const fetchPage = async (page: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/saved_jobs?page=${page}&limit=${pagination.limit}`);
      setSavedJobs(response.data?.savedJobs || []);
      setPagination(response.data?.pagination || pagination);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
      setError('We could not load saved jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId: number) => {
    setRemovingJobId(jobId);
    try {
      await api.delete(`/saved_jobs/${jobId}`);
      // Update local state
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to unsave job:', error);
    } finally {
      setRemovingJobId(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const jobCards = savedJobs.map((job: any, index: number) => {
    return (
      <motion.div
        key={job.id}
        className="job-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22,  1,  0.36,  1] as any }}
      >
        <div className="job-card__top">
          <div className="job-card__meta">
            <span className="job-card__time">
              Saved: {timeAgo(job.savedAt)}
            </span>
            {job.job_type === 'fixed' ? (
              <span className="pl-badge pl-badge-primary">Fixed</span>
            ) : (
              <span className="pl-badge pl-badge-warning">Milestones</span>
            )}
          </div>
          <div className="job-card__budget">&#x20A6;{Number(job.budget || 0).toLocaleString()}</div>
        </div>

        <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="job-card__title">{job.title}</h3>
        </Link>
        
        <p className="job-card__desc line-clamp-2">{job.description}</p>

        {job.skills && job.skills.length > 0 && (
          <div className="job-card__skills">
            {job.skills.slice(0, 5).map((s: any) => (
              <span key={s.id} className="job-card__skill">{s.name}</span>
            ))}
            {job.skills.length > 5 && (
              <span className="job-card__skill job-card__skill--more">+{job.skills.length - 5}</span>
            )}
          </div>
        )}

        <div className="job-card__bottom">
          <span className="job-card__client">
            {job.client?.profile?.full_name || 'Client'}
            {job.client?.email_verified && (
              <span className="job-card__verified" title="Verified Client">✓</span>
            )}
          </span>
          {job._count?.bids !== undefined && (
            <span className="job-card__bids">{job._count.bids} bid{job._count.bids !== 1 ? 's' : ''}</span>
          )}
          <button
            className={`job-card__save job-card__save--saved ${removingJobId === job.id ? 'job-card__save--removing' : ''}`}
            onClick={() => handleRemoveJob(job.id)}
            disabled={removingJobId === job.id}
            aria-label="Remove from saved jobs"
          >
            {removingJobId === job.id ? (
              <span className="pl-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              '✕'
            )}
          </button>
        </div>
      </motion.div>
    );
  });

  if (loading) {
    return (
      <div className="page" ref={pageRef}>
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

  return (
    <div className="page" ref={pageRef}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22,  1,  0.36,  1] as any }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)' }}>Saved Jobs</h1>
              <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
                {pagination.total} job{pagination.total !== 1 ? 's' : ''} saved
              </p>
            </div>
            {savedJobs.length > 0 && (
              <Link href="/jobs" className="btn btn-outline">
                🔍 Find More Work
              </Link>
            )}
          </div>
        </motion.div>

        {error && (
          <motion.div
            className="pl-alert pl-alert-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {savedJobs.length > 0 ? (
          <>
            <AnimatePresence>
              <motion.div
                className="jobs-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {jobCards}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchPage(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  ← Previous
                </button>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            className="jobs-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="jobs-empty__icon">🔖</span>
            <h2 className="jobs-empty__title">No saved jobs yet</h2>
            <p className="jobs-empty__text">Start browsing and save jobs you&apos;re interested in to see them here.</p>
            <Link href="/jobs" className="pl-btn pl-btn-primary">
              🔍 Find Work to Save
            </Link>
          </motion.div>
        )}
      </div>

      <style>{`
        .page {
          min-height: calc(100vh - var(--navbar-h));
          background: var(--bg);
        }

        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .job-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          transition: all 0.15s;
        }
        .job-card:hover {
          border-color: var(--border2);
          background: var(--surface2);
        }
        .job-card__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }
        .job-card__meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .job-card__time {
          font-size: 0.78rem;
          color: var(--fg-secondary);
        }
        .job-card__budget {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--primary);
        }
        .job-card__title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--fg);
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        .job-card__desc {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }
        .job-card__skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.85rem;
        }
        .job-card__skill {
          background: var(--surface-hover);
          color: var(--fg);
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid var(--border);
        }
        .job-card__skill--more {
          color: var(--fg-secondary);
        }
        .job-card__bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .job-card__client {
          font-size: 0.8rem;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .job-card__verified {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: var(--primary);
          color: #fff;
          border-radius: 50%;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .job-card__bids {
          font-size: 0.78rem;
          color: var(--fg-secondary);
        }

        /* Save/Remove button */
        .job-card__save {
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.4rem 0.6rem;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
        }
        .job-card__save--saved {
          border-color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        .job-card__save--saved:hover:not(:disabled) {
          background: var(--danger);
          color: #fff;
        }
        .job-card__save:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .job-card__save--removing {
          border-color: var(--danger);
          color: var(--danger);
        }

        /* Empty state */
        .jobs-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 2rem;
          text-align: center;
          gap: 1rem;
        }
        .jobs-empty__icon {
          font-size: 3rem;
        }
        .jobs-empty__title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--fg);
          margin: 0;
        }
        .jobs-empty__text {
          color: var(--muted);
          font-size: 0.95rem;
          max-width: 400px;
          line-height: 1.6;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
