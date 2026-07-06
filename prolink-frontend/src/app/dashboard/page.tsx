'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import withAuth from '../../components/withAuth';
import { AnimatedSection, AnimatedStaggerItem, AnimatedCard, AnimatedHoverCard } from '../../components/AnimatedComponents';
import { useSocket } from '../../lib/SocketContext';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

// ── Avatar colour consistent per name ──
const COLORS = ['#00D68F', '#4A8CFF', '#E8633C', '#F0B429', '#A78BFA', '#F472B6'];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || 'A').length; i++) hash = (name || 'A').charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ── Mini timeline dot colour per event type ──
function eventColor(type) {
  const m = { bid: '--copper', message: '--blue', milestone: '--accent', payment: '--gold', dispute: '--danger', system: '--info' };
  return `var(${m[type] || '--accent'})`;
}

// ═══════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════
function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [openToWork, setOpenToWork] = useState(false);
  const [openToWorkLoading, setOpenToWorkLoading] = useState(false);

  const { socket } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await api.get('/profiles/me');
      setProfile(profileRes.data);
      setOpenToWork(profileRes.data.availability === 'open');
      if (profileRes.data.user_type === 'provider') {
        const [jobsRes, earningsRes] = await Promise.allSettled([
          api.get('/jobs?limit=4'),
          api.get('/profiles/me/earnings'),
        ]);
        if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data || []);
        if (earningsRes.status === 'fulfilled') setEarnings(earningsRes.value.data);
      } else {
        try {
          const jobsRes = await api.get('/jobs/my-jobs');
          setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : []);
        } catch { /* noop */ }
      }
      try {
        const notifRes = await api.get('/notifications?limit=8');
        setNotifications(notifRes.data?.notifications || notifRes.data || []);
      } catch { /* noop */ }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleBidUpdate = (data) => {
      // Reload dashboard silently on new bid
      load();
    };
    socket.on('bid_update', handleBidUpdate);
    socket.on('global_notification', handleBidUpdate);
    return () => {
      socket.off('bid_update', handleBidUpdate);
      socket.off('global_notification', handleBidUpdate);
    };
  }, [socket, load]);

  const toggleOpenToWork = async () => {
    setOpenToWorkLoading(true);
    const next = !openToWork;
    setOpenToWork(next);
    try {
      await api.patch('/profiles/me', { availability: next ? 'open' : 'unavailable' });
    } catch {
      setOpenToWork(!next);
    } finally {
      setOpenToWorkLoading(false);
    }
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

  if (!profile) {
    return (
      <div className="page">
        <div className="wrap-sm" style={{ paddingTop: '3rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: FAUCET_EASING }}
          >
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--fg-secondary)', marginBottom: '1rem' }}>{error || 'Could not load your profile.'}</p>
              <button onClick={load} className="btn btn-outline">Retry</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const isProvider = profile.user_type === 'provider';

  return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: '0.75rem' }}
        >
          <div>
            <div className="eyebrow">{isProvider ? 'Provider Dashboard' : 'Client Dashboard'}</div>
            <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
              {profile.full_name ? (isProvider ? 'Good morning, ' : 'Welcome back, ') + profile.full_name.split(' ')[0] : 'Welcome back'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isProvider ? (
              <button
                onClick={toggleOpenToWork}
                disabled={openToWorkLoading}
                className="btn btn-surface btn-sm"
                style={{ borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  className="pulse-dot"
                  style={{ background: openToWork ? 'var(--success)' : 'var(--fg-tertiary)', width: 7, height: 7 }}
                />
                {openToWork ? 'Open to work' : 'Closed'}
              </button>
            ) : (
              <Link href="/jobs/new" className="btn btn-copper btn-sm group" style={{ borderRadius: 999 }}>
                + Post a job
              </Link>
            )}
            <span className={'badge ' + (isProvider ? 'badge-gold' : 'badge-info')} style={{ padding: '4px 14px' }}>
              {isProvider ? 'Provider' : 'Client'}
            </span>
          </div>
        </motion.div>

        {isProvider ? (
          <ProviderDashboard profile={profile} earnings={earnings} recentJobs={recentJobs} notifications={notifications} />
        ) : (
          <ClientDashboard profile={profile} notifications={notifications} myJobs={myJobs} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PROVIDER DASHBOARD — workspace feel
// ═══════════════════════════════════════════════════════════════
function ProviderDashboard({ profile, earnings, recentJobs, notifications }) {
  const totalEarned = earnings?.total_paid ? String(Number(earnings.total_paid).toLocaleString()) : '0';
  const thisMonth = earnings?.this_month ? String(Number(earnings.this_month).toLocaleString()) : '0';
  const activeContracts = profile?.active_contracts || 0;
  const bidWinRate = profile?.bid_win_rate != null ? profile.bid_win_rate + '%' : '—';

  return (
    <>
      {/* ── Stat row ── */}
      <AnimatedSection delay={0.1} stagger={0.08}>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: 'var(--space-xl)' }}>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--gold)' }}>
                {totalEarned === '0' ? <span style={{ color: 'var(--fg-tertiary)' }}>—</span> : <><span className="naira">₦</span>{totalEarned}</>}
              </div>
              <div className="stat-label">Total Earned</div>
              {totalEarned === '0' && <div className="stat-delta" style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>Complete your first job to start earning</div>}
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--gold)' }}>
                {thisMonth === '0' ? <span style={{ color: 'var(--fg-tertiary)' }}>—</span> : <><span className="naira">₦</span>{thisMonth}</>}
              </div>
              <div className="stat-label">This Month</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number">{activeContracts || <span style={{ color: 'var(--fg-tertiary)' }}>—</span>}</div>
              <div className="stat-label">Active Contracts</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--copper)' }}>{bidWinRate}</div>
              <div className="stat-label">Bid Win Rate</div>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Earnings chart placeholder ── */}
      <AnimatedSection delay={0.15}>
        <AnimatedStaggerItem>
          <div className="card-base" style={{ padding: '1.5rem', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Earnings Trend</h3>
              <span className="badge badge-neutral">Last 7 days</span>
            </div>
            <div style={{ position: 'relative', height: 160, background: 'var(--accent-alpha)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {/* Placeholder chart — 7 bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%', padding: '1rem' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ flex: 1, height: `${10 + Math.sin(i) * 20 + 20}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: 0.3 }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Earnings will appear here after your first completed job
              </div>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedSection>

      {/* ── Two-column: matching jobs + active contracts ── */}
      <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Matching jobs */}
        <AnimatedSection delay={0.2}>
          <AnimatedStaggerItem>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '0.75rem' }}>Matching Jobs</h3>
          </AnimatedStaggerItem>
          {recentJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentJobs.slice(0, 4).map((job, i) => (
                <AnimatedStaggerItem key={job.id || i}>
                  <Link href={'/jobs/' + job.id} className="card-base" style={{ padding: '1rem 1.25rem', textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{job.title}</h4>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap', fontSize: 'var(--text-sm)' }}>
                        <span className="naira">₦</span>{Number(job.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.2rem' }}>
                      {job.location || 'Remote'} · {job.job_type || 'Fixed'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--fg-tertiary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--text-xs)' }}>
                        Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                      </span>
                      <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>
                        {job.bid_count || 0} provider{(job.bid_count || 0) !== 1 ? 's' : ''} have bid
                      </span>
                    </div>
                  </Link>
                </AnimatedStaggerItem>
              ))}
            </div>
          ) : (
            <AnimatedStaggerItem>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="empty-state-title">No matching jobs yet</div>
                <div className="empty-state-desc">Check back soon or update your skills to find better matches.</div>
              </div>
            </AnimatedStaggerItem>
          )}
          {recentJobs.length > 0 && (
            <AnimatedStaggerItem>
              <Link href="/jobs" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>Browse all jobs →</Link>
            </AnimatedStaggerItem>
          )}
        </AnimatedSection>

        {/* Active contracts */}
        <AnimatedSection delay={0.3}>
          <AnimatedStaggerItem>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '0.75rem' }}>My Active Contracts</h3>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div className="empty-state-title">No active contracts</div>
              <div className="empty-state-desc">When you're hired, your contracts will show up here with milestone tracking.</div>
            </div>
          </AnimatedStaggerItem>
        </AnimatedSection>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CLIENT DASHBOARD — control centre feel
// ═══════════════════════════════════════════════════════════════
function ClientDashboard({ profile, notifications, myJobs }) {
  const jobsList = Array.isArray(myJobs) ? myJobs : [];
  const openJobs = jobsList.filter(j => j.status === 'open');
  const totalBids = jobsList.reduce(function(s, j) { return s + (j.bid_count || 0); }, 0);
  const activeContracts = jobsList.filter(j => j.status === 'in_progress' || j.status === 'assigned').length;
  const spentThisMonth = jobsList.reduce((s, j) => s + (Number(j.budget || 0)), 0);

  // Items needing attention
  const needsAttention = [];
  openJobs.forEach(j => {
    if (j.bid_count > 0) needsAttention.push({ type: 'bid', job: j, desc: `New bids on "${j.title}"`, action: 'Review bids', href: `/jobs/${j.id}` });
  });
  jobsList.filter(j => j.status === 'in_progress').forEach(j => {
    needsAttention.push({ type: 'milestone', job: j, desc: `Milestone approval needed for "${j.title}"`, action: 'View contract', href: `/dashboard/contracts/${j.id}` });
  });
  const unreadMessages = notifications.filter(n => n.type === 'message' && !n.read);
  unreadMessages.forEach(n => {
    needsAttention.push({ type: 'message', job: null, desc: n.message || 'Unread message', action: 'View messages', href: '/dashboard/messages' });
  });

  return (
    <>
      {/* ── Stat row ── */}
      <AnimatedSection delay={0.1} stagger={0.08}>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: 'var(--space-xl)' }}>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number">{openJobs.length || <span style={{ color: 'var(--fg-tertiary)' }}>—</span>}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--copper)' }}>{totalBids || <span style={{ color: 'var(--fg-tertiary)' }}>—</span>}</div>
              <div className="stat-label">Bids to Review</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--blue)' }}>{activeContracts || <span style={{ color: 'var(--fg-tertiary)' }}>—</span>}</div>
              <div className="stat-label">Contracts Ongoing</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-stat">
              <div className="stat-number" style={{ color: 'var(--gold)' }}>
                {spentThisMonth > 0 ? <><span className="naira">₦</span>{spentThisMonth.toLocaleString()}</> : <span style={{ color: 'var(--fg-tertiary)' }}>—</span>}
              </div>
              <div className="stat-label">Spent (Total)</div>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Needs Attention card ── */}
      <AnimatedSection delay={0.15}>
        <AnimatedStaggerItem>
          {needsAttention.length > 0 ? (
            <div className="card-featured" style={{ padding: '1.25rem', marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '0.75rem' }}>Needs Attention</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <motion.ul
                  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="visible"
                  style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
                >
                  {needsAttention.slice(0, 4).map((item, i) => (
                    <motion.li
                      key={i}
                      variants={{
                        hidden:  { opacity: 0, x: -16 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < Math.min(needsAttention.length, 4) - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <span className="pulse-dot" style={{ background: item.type === 'bid' ? 'var(--copper)' : item.type === 'milestone' ? 'var(--accent)' : 'var(--blue)', width: 6, height: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</span>
                    </div>
                    <Link href={item.href} className="btn btn-copper btn-sm" style={{ flexShrink: 0, fontSize: 'var(--text-xs)', padding: '0.3rem 0.8rem' }}>{item.action}</Link>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
            </div>
          ) : (
            <div className="card-base" style={{ padding: '1.25rem', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="pulse-dot" style={{ background: 'var(--success)', width: 8, height: 8 }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>All caught up! No items need your attention right now.</span>
            </div>
          )}
        </AnimatedStaggerItem>
      </AnimatedSection>

      {/* ── Two-column: recent jobs + activity feed ── */}
      <div className="dash-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Recent jobs */}
        <AnimatedSection delay={0.2}>
          <AnimatedStaggerItem>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>My Recent Jobs</h3>
              <Link href="/dashboard/my-jobs" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>View all →</Link>
            </div>
          </AnimatedStaggerItem>
          {jobsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {jobsList.slice(0, 5).map((job, i) => (
                <AnimatedStaggerItem key={job.id || i}>
                  <Link href={'/jobs/' + job.id} className="card-base" style={{ padding: '0.85rem 1.1rem', textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{job.title}</h4>
                      <span className={'badge ' + (job.status === 'open' ? 'badge-success' : job.status === 'in_progress' || job.status === 'assigned' ? 'badge-info' : 'badge-neutral')} style={{ fontSize: '10px' }}>
                        {job.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-xs)', marginTop: '0.2rem' }}>
                      {(job.bid_count || 0) + ' bid' + ((job.bid_count || 0) !== 1 ? 's' : '') + ' received'}
                    </div>
                  </Link>
                </AnimatedStaggerItem>
              ))}
            </div>
          ) : (
            <AnimatedStaggerItem>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className="empty-state-title">No jobs yet</div>
                <div className="empty-state-desc">Post your first job and start receiving bids from verified Nigerian professionals.</div>
                <Link href="/jobs/new" className="btn btn-copper btn-sm">Post a job</Link>
              </div>
            </AnimatedStaggerItem>
          )}
        </AnimatedSection>

        {/* Activity feed — timeline style */}
        <AnimatedSection delay={0.25}>
          <AnimatedStaggerItem>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '0.75rem' }}>Activity Feed</h3>
          </AnimatedStaggerItem>
          {notifications.length > 0 ? (
            <AnimatedStaggerItem>
              <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.slice(0, 8).map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: eventColor(n.type), flexShrink: 0, marginTop: 3, marginLeft: '-1.25rem', position: 'relative', zIndex: 1, border: '2px solid var(--bg)' }} />
                      <div style={{ minWidth: 0 }}>
                        {n.title && <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{n.title}</div>}
                        <div style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>{n.message || n.description}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: '0.15rem' }}>
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedStaggerItem>
          ) : (
            <AnimatedStaggerItem>
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="empty-state-title" style={{ fontSize: 'var(--text-md)' }}>No activity yet</div>
                <div className="empty-state-desc">Your activity feed will show notifications, bids, and updates here.</div>
              </div>
            </AnimatedStaggerItem>
          )}
        </AnimatedSection>
      </div>
    </>
  );
}

export default withAuth(DashboardPage);
