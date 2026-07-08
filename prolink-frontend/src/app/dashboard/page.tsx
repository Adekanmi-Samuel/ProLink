'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import withAuth from '../../components/withAuth';
import { AnimatedSection, AnimatedStaggerItem, AnimatedCard, AnimatedHoverCard } from '../../components/AnimatedComponents';
import { useSocket } from '../../lib/SocketContext';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

// ── Avatar colour consistent per name ──
const COLORS = ['#00D68F', '#4A8CFF', '#E8633C', '#F0B429', '#A78BFA', '#F472B6'];
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || 'A').length; i++) hash = (name || 'A').charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ── Mini timeline dot colour per event type ──
function eventColor(type: string) {
  const m: Record<string, string> = { bid: '--copper', message: '--blue', milestone: '--accent', payment: '--gold', dispute: '--danger', system: '--info' };
  return `var(${m[type] || '--accent'})`;
}

// ═══════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════
function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [openToWork, setOpenToWork] = useState(false);
  const [openToWorkLoading, setOpenToWorkLoading] = useState(false);
  const router = useRouter();

  const { socket } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await api.get('/profiles/me');
      setProfile(profileRes.data);
      setOpenToWork(profileRes.data.availability === 'open');
      if (profileRes.data.user_type === 'provider') {
        const [jobsRes, earningsRes, contractsRes] = await Promise.allSettled([
          api.get('/jobs?limit=4'),
          api.get('/profiles/me/earnings'),
          api.get('/jobs/my-jobs'),
        ]);
        if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data || []);
        if (earningsRes.status === 'fulfilled') setEarnings(earningsRes.value.data);
        if (contractsRes.status === 'fulfilled') setMyJobs(Array.isArray(contractsRes.value.data) ? contractsRes.value.data : []);
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
      
      // Redirect admins immediately
      if (profileRes.data.user_type === 'admin') {
        router.push('/admin');
        return;
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleBidUpdate = (data: any) => {
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
        <div className="wrap" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
          {/* Stat cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />
            ))}
          </div>
          {/* Two column below */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '40%', height: 24, marginBottom: '0.5rem' }} />
              {[1,2,3].map(i => (
                <div key={i} className="skeleton skeleton-card" style={{ height: 72 }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '40%', height: 24, marginBottom: '0.5rem' }} />
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
                  <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '70%', height: 12, borderRadius: 4 }} />
                    <div className="skeleton skeleton-text" style={{ width: '45%', height: 12, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
  const isAdmin = profile.user_type === 'admin';

  if (isAdmin) {
    // Return empty while redirecting
    return null;
  }

  return (
    <div className="page">
      <div className="wrap" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>
        
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: FAUCET_EASING }}
        >
          <div className={`dash-banner ${isProvider ? 'dash-banner--provider' : 'dash-banner--client'}`}>
            <div className="dash-banner__eyebrow">{isProvider ? 'Provider Dashboard' : 'Client Dashboard'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="dash-banner__name">
                  {profile.full_name ? (isProvider ? 'Good morning, ' : 'Welcome back, ') + profile.full_name.split(' ')[0] : 'Welcome back'}
                </h1>
                <p className="dash-banner__sub">Here is what's happening with your account today.</p>
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
                    {openToWork ? 'Open to work' : 'Not available'}
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
            </div>
          </div>
        </motion.div>

        {isProvider ? (
          <ProviderDashboard profile={profile} earnings={earnings} recentJobs={recentJobs} notifications={notifications} myJobs={myJobs} />
        ) : (
          <ClientDashboard profile={profile} notifications={notifications} myJobs={myJobs} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PROVIDER DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ProviderDashboard({ profile, earnings, recentJobs, notifications, myJobs }: any) {
  const totalEarned = earnings?.total_paid ? String(Number(earnings.total_paid).toLocaleString()) : '0';
  const thisMonth = earnings?.this_month ? String(Number(earnings.this_month).toLocaleString()) : '0';
  const activeContracts = profile?.active_contracts || 0;
  const bidWinRate = profile?.bid_win_rate != null ? profile.bid_win_rate + '%' : '—';

  return (
    <>
      <AnimatedSection delay={0.1} stagger={0.08}>
        <div className="stat-grid-4">
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number gold">
                {totalEarned === '0' ? '—' : <><span className="naira">₦</span>{totalEarned}</>}
              </span>
              <span className="stat-label">Total Earned</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number gold">
                {thisMonth === '0' ? '—' : <><span className="naira">₦</span>{thisMonth}</>}
              </span>
              <span className="stat-label">This Month</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number">{activeContracts || '—'}</span>
              <span className="stat-label">Active Contracts</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number">{bidWinRate}</span>
              <span className="stat-label">Bid Win Rate</span>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <AnimatedStaggerItem>
          <div className="earnings-card">
            <div className="earnings-card__header">
              <div className="earnings-card__title">Earnings Trend</div>
              <span className="badge badge-neutral">Last 7 days</span>
            </div>
            {totalEarned === '0' ? (
              <div className="earnings-empty">
                Earnings will appear here after your first completed job
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--fg-tertiary)', paddingBottom: '1.5rem' }}>
                  <span>₦50k</span>
                  <span>₦25k</span>
                  <span>₦0</span>
                </div>
                <div className="earnings-bars" style={{ flex: 1 }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="earnings-bar" style={{ height: `${20 + Math.random() * 80}%` }}>
                      <div className="earnings-bar__label">Day {i+1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnimatedStaggerItem>
      </AnimatedSection>

      <div className="dash-grid-2">
        <AnimatedSection delay={0.2}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">Matching Jobs</div>
              <Link href="/jobs" className="dash-section-link">Browse all →</Link>
            </div>
          </AnimatedStaggerItem>
          {recentJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentJobs.slice(0, 4).map((job: any, i: number) => (
                <AnimatedStaggerItem key={job.id || i}>
                  <Link href={'/jobs/' + job.id} className="job-row">
                    <div className="job-row__dot" style={{ background: 'var(--accent)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="job-row__title">{job.title}</div>
                      <div className="job-row__meta">
                        {job.location || 'Remote'} · {job.job_type || 'Fixed'} · Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'recently'}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--amber)', fontSize: '0.85rem' }}>
                      <span className="naira">₦</span>{Number(job.budget || 0).toLocaleString()}
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
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">My Active Contracts</div>
              <Link href="/dashboard/contracts" className="dash-section-link">View all →</Link>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            {myJobs && myJobs.filter((j: any) => j.status === 'in_progress' || j.status === 'assigned').length > 0 ? (
              myJobs.filter((j: any) => j.status === 'in_progress' || j.status === 'assigned').map((c: any) => (
                <Link key={c.id} href={`/dashboard/contracts/${c.id}`} className="card-base" style={{ padding: '1rem', textDecoration: 'none', display: 'block', marginBottom: '0.65rem' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{c.title || 'Contract'}</div>
                  <div style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)', marginTop: '0.2rem' }}>
                    {c.status?.replace('_', ' ')}
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="empty-state-title">No active contracts</div>
                <div className="empty-state-desc">Win a bid and your contract will appear here — complete with milestone tracking and payment history.</div>
              </div>
            )}
          </AnimatedStaggerItem>
        </AnimatedSection>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CLIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ClientDashboard({ profile, notifications, myJobs }: any) {
  const jobsList = Array.isArray(myJobs) ? myJobs : [];
  const openJobs = jobsList.filter(j => j.status === 'open');
  const totalBids = jobsList.reduce(function(s, j) { return s + (j.bid_count || 0); }, 0);
  const activeContracts = jobsList.filter(j => j.status === 'in_progress' || j.status === 'assigned').length;
  const spentThisMonth = jobsList.reduce((s, j) => s + (Number(j.budget || 0)), 0);

  // Items needing attention
  const needsAttention: any[] = [];
  openJobs.forEach(j => {
    if (j.bid_count > 0) needsAttention.push({ type: 'bid', job: j, desc: `New bids on "${j.title}"`, action: 'Review bids', href: `/jobs/${j.id}` });
  });
  jobsList.filter(j => j.status === 'in_progress').forEach(j => {
    needsAttention.push({ type: 'milestone', job: j, desc: `Milestone approval needed for "${j.title}"`, action: 'View contract', href: `/dashboard/contracts/${j.id}` });
  });
  const unreadMessages = notifications.filter((n: any) => n.type === 'message' && !n.read);
  unreadMessages.forEach((n: any) => {
    needsAttention.push({ type: 'message', job: null, desc: n.message || 'Unread message', action: 'View messages', href: '/dashboard/messages' });
  });

  return (
    <>
      <AnimatedSection delay={0.1} stagger={0.08}>
        <div className="stat-grid-4">
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number">{openJobs.length || '—'}</span>
              <span className="stat-label">Active Jobs</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number">{totalBids || '—'}</span>
              <span className="stat-label">Bids to Review</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number">{activeContracts || '—'}</span>
              <span className="stat-label">Contracts Ongoing</span>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="stat-card">
              <span className="stat-number gold">
                {spentThisMonth > 0 ? <><span className="naira">₦</span>{spentThisMonth.toLocaleString()}</> : '—'}
              </span>
              <span className="stat-label">Total Budget Posted</span>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <AnimatedStaggerItem>
          {needsAttention.length > 0 ? (
            <div className="card-base" style={{ padding: '1.25rem', marginBottom: 'var(--space-xl)' }}>
              <div className="dash-section-header" style={{ marginBottom: '1rem' }}>
                <div className="dash-section-title">Needs Attention</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {needsAttention.slice(0, 4).map((item, i) => (
                  <div key={i} className="attention-item">
                    <div className="attention-dot" style={{ background: item.type === 'bid' ? 'var(--copper)' : item.type === 'milestone' ? 'var(--accent)' : 'var(--blue)' }} />
                    <div className="attention-desc">{item.desc}</div>
                    <Link href={item.href} className="attention-action">{item.action}</Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-base" style={{ padding: '1.25rem', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="attention-dot" style={{ background: 'var(--success)', width: 10, height: 10 }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>All caught up! No items need your attention right now.</span>
            </div>
          )}
        </AnimatedStaggerItem>
      </AnimatedSection>

      <div className="dash-grid-2">
        <AnimatedSection delay={0.2}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">My Recent Jobs</div>
              <Link href="/dashboard/my-jobs" className="dash-section-link">View all →</Link>
            </div>
          </AnimatedStaggerItem>
          {jobsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {jobsList.slice(0, 5).map((job: any, i: number) => (
                <AnimatedStaggerItem key={job.id || i}>
                  <Link href={'/jobs/' + job.id} className="job-row">
                    <div className="job-row__dot" style={{ background: job.status === 'open' ? 'var(--success)' : 'var(--info)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="job-row__title">{job.title}</div>
                      <div className="job-row__meta">
                        {(job.bid_count || 0)} bid{(job.bid_count || 0) !== 1 ? 's' : ''} received
                      </div>
                    </div>
                    <div className={'badge ' + (job.status === 'open' ? 'badge-success' : job.status === 'in_progress' || job.status === 'assigned' ? 'badge-info' : 'badge-neutral')} style={{ fontSize: '10px' }}>
                      {job.status?.replace('_', ' ')}
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

        <AnimatedSection delay={0.25}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">Activity Feed</div>
            </div>
          </AnimatedStaggerItem>
          {notifications.length > 0 ? (
            <AnimatedStaggerItem>
              <div className="card-base" style={{ padding: '1.25rem' }}>
                <div className="feed-line">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.slice(0, 8).map((n: any, i: number) => (
                      <div key={i} className="feed-item">
                        <div className="feed-dot" style={{ borderColor: eventColor(n.type) }} />
                        <div style={{ minWidth: 0 }}>
                          {n.title && <div className="feed-title">{n.title}</div>}
                          <div className="feed-desc">{n.message || n.description}</div>
                          <div className="feed-time">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
