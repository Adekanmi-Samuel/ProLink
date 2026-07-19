'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAdmin from '../../../components/withAdmin';

const FAUCET_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATUS_STYLES: Record<string, { bg: string; c: string }> = {
  open: { bg: 'rgba(34,197,94,0.12)', c: '#22c55e' },
  assigned: { bg: 'rgba(59,130,246,0.12)', c: '#3b82f6' },
  completed: { bg: 'rgba(107,114,128,0.12)', c: '#6b7280' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', c: '#ef4444' },
};

function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/admin/jobs?${params.toString()}`);
      setJobs(res.data?.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [statusFilter]);

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/jobs/${jobId}`);
      fetchJobs();
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  const FilterBtn = ({ label, value }: { label: string; value: string }) => (
    <motion.button
      onClick={() => setStatusFilter(value)}
      style={{
        background: statusFilter === value ? 'var(--accent)' : 'var(--surface)',
        color: statusFilter === value ? '#fff' : 'var(--fg-secondary)',
        border: '1px solid var(--border)', padding: '0.35rem 0.85rem',
        fontSize: '0.8rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: FAUCET_EASING }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="eyebrow">Admin</div>
          <h1 style={{ fontFamily: 'var(--font-heading), sans-serif', fontWeight: 800, fontSize: '1.75rem' }}>Jobs</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchJobs()}
            className="field"
            style={{ width: 220 }}
          />
          <motion.button onClick={fetchJobs} className="btn btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
            Search
          </motion.button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <FilterBtn label="All" value="" />
        <FilterBtn label="Open" value="open" />
        <FilterBtn label="Assigned" value="assigned" />
        <FilterBtn label="Completed" value="completed" />
        <FilterBtn label="Cancelled" value="cancelled" />
      </div>

      {loading ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : (
        <motion.div
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                  <TH>Title</TH>
                  <TH>Client</TH>
                  <TH>Category</TH>
                  <TH>Budget</TH>
                  <TH>Type</TH>
                  <TH>Status</TH>
                  <TH>Bids</TH>
                  <TH>Posted</TH>
                  <TH style={{ textAlign: 'right' }}>Actions</TH>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {jobs.map((j: any, i: number) => (
                    <motion.tr
                      key={j.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.02 * i }}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      whileHover={{ background: 'var(--accent-alpha)' }}
                    >
                      <td style={tdStyle}><strong style={{ fontSize: '0.85rem' }}>{j.title}</strong></td>
                      <td style={{ ...tdStyle, color: 'var(--fg-secondary)', fontSize: '0.82rem' }}>{j.client?.profile?.full_name || '—'}</td>
                      <td style={tdStyle}>{j.category?.name || '—'}</td>
                      <td style={tdStyle}>₦{Number(j.budget || 0).toLocaleString()}</td>
                      <td style={tdStyle}>
                        <Badge label={j.job_type} color="#6b7280" />
                      </td>
                      <td style={tdStyle}>
                        <Badge label={j.status} color={STATUS_STYLES[j.status]?.c || '#6b7280'} bg={STATUS_STYLES[j.status]?.bg} />
                      </td>
                      <td style={tdStyle}>{j._count?.bids || 0}</td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', color: 'var(--fg-tertiary)' }}>{j.posted_at ? new Date(j.posted_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <motion.button onClick={() => handleDelete(j.id)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', borderRadius: 'var(--radius)', cursor: 'pointer' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          Delete
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {jobs.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--fg-tertiary)' }}>No jobs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}


    </motion.div>
  );
}

const TH = ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)' }} {...rest}>
    {children}
  </th>
);

const tdStyle = { padding: '0.65rem 0.85rem', fontSize: '0.85rem' };

const Badge = ({ label, color, bg }: { label: string; color: string; bg?: string }) => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    style={{
      display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: 999,
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      background: bg || 'rgba(107,114,128,0.1)', color,
    }}
  >
    {label}
  </motion.span>
);

export default withAdmin(AdminJobsPage);
