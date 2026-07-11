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
  const [earningsChart, setEarningsChart] = useState<any[]>([]);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [smartMatchesLoading, setSmartMatchesLoading] = useState(false);
  const router = useRouter();

  const { socket } = useSocket();

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const profileRes = await api.get('/profiles/me');
      setProfile(profileRes.data);
      setOpenToWork(profileRes.data.availability === 'open');

      if (profileRes.data.user_type === 'provider') {
        const [jobsRes, earningsRes, contractsRes, earningsChartRes] = await Promise.allSettled([
          api.get('/jobs?limit=4'),
          api.get('/profiles/me/earnings'),
          api.get('/jobs/my-jobs'),
          api.get('/profiles/me/earnings-chart'),
        ]);

        if (profileRes.data.is_premium) {
          setSmartMatchesLoading(true);
          api.get('/ai/jobs/match').then(res => {
            setSmartMatches(res.data.matches || []);
          }).catch(() => {
            setSmartMatches([]);
          }).finally(() => setSmartMatchesLoading(false));
        }
        if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data || []);
        if (earningsRes.status === 'fulfilled') setEarnings(earningsRes.value.data);
        if (contractsRes.status === 'fulfilled') setMyJobs(Array.isArray(contractsRes.value.data) ? contractsRes.value.data : []);
        const chartData = earningsChartRes.status === 'fulfilled' ? earningsChartRes.value.data : [];

        // Redirect admins immediately
        if (profileRes.data.user_type === 'admin') {
          router.push('/admin');
          return;
        }

        // Pass chartData to ProviderDashboard
        setEarningsChart(chartData);
      } else {
        try {
          const jobsRes = await api.get('/jobs/my-jobs');
          setMyJobs(Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data.jobs || []));
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
      if (!silent) setError(err?.message || String(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // Polling fallback/supplement
    const interval = setInterval(() => {
      load(true);
    }, 15000);

    if (!socket) return () => clearInterval(interval);

    const handleUpdate = () => {
      load(true);
    };
    socket.on('bid_update', handleUpdate);
    socket.on('notification', handleUpdate);
    socket.on('global_notification', handleUpdate);
    
    return () => {
      clearInterval(interval);
      socket.off('bid_update', handleUpdate);
      socket.off('notification', handleUpdate);
      socket.off('global_notification', handleUpdate);
    };
  }, [socket, load]);

  const toggleOpenToWork = async () => {
    setOpenToWorkLoading(true);
    const next = !openToWork;
    setOpenToWork(next);
    try {
      await api.put('/profiles/me', { availability: next ? 'open' : 'unavailable' });
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

      {/* ═══ WELCOME BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: FAUCET_EASING }}
        className={`dash-banner dash-banner--${isProvider ? 'provider' : 'client'}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="dash-banner__eyebrow">
              {isProvider ? 'Provider Dashboard' : 'Client Dashboard'}
            </div>
            <div className="dash-banner__name">
              {profile.full_name
                ? (isProvider ? 'Good morning, ' : 'Welcome back, ') + profile.full_name.split(' ')[0]
                : 'Welcome back'}
            </div>
            <div className="dash-banner__sub">
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              {isProvider ? "Here's your workspace" : "Here's what's happening today"}
            </div>
            {/* Trust chips */}
            <div className="trust-row">
              {profile.email_verified && (
                <span className="trust-chip trust-chip--verified">✓ Email verified</span>
              )}
              {profile.nin_status === 'verified' && (
                <span className="trust-chip trust-chip--verified">✓ NIN verified</span>
              )}
              {profile.nin_status === 'pending' && (
                <span className="trust-chip trust-chip--pending">⏳ NIN pending</span>
              )}
              {!profile.nin_status || profile.nin_status === 'none' ? (
                <span className="trust-chip trust-chip--unverified">○ Not ID verified</span>
              ) : null}
            </div>
          </div>
          <div className="dash-banner__actions">
            {isProvider ? (
              <button
                onClick={toggleOpenToWork}
                disabled={openToWorkLoading}
                className="btn btn-surface btn-sm"
                style={{ borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: openToWork ? 'var(--accent)' : 'var(--fg-tertiary)',
                    display: 'inline-block', flexShrink: 0,
                    boxShadow: openToWork ? '0 0 0 3px var(--accent-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                />
                {openToWork ? 'Open to work' : 'Not available'}
              </button>
            ) : (
              <Link href="/jobs/new" className="btn btn-copper btn-sm" style={{ borderRadius: 999 }}>
                + Post a job
              </Link>
            )}
            <span className={'badge ' + (isProvider ? 'badge-gold' : 'badge-info')} style={{ padding: '5px 16px' }}>
              {isProvider ? 'Provider' : 'Client'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROLE-SPECIFIC CONTENT ═══ */}
      {isProvider ? (
        <ProviderDashboard
          profile={profile}
          earnings={earnings}
          recentJobs={recentJobs}
          notifications={notifications}
          smartMatches={smartMatches}
          smartMatchesLoading={smartMatchesLoading}
        />
      ) : (
        <ClientDashboard
          profile={profile}
          notifications={notifications}
          myJobs={myJobs}
        />
      )}
    </div>
  </div>
);
}

// ═══════════════════════════════════════════════════════════════
//  PROVIDER DASHBOARD
// ═══════════════════════════════════════════════════════════════
function ProviderDashboard({ profile, earnings, recentJobs, notifications, myJobs, earningsChart, smartMatches, smartMatchesLoading }: any) {
  const totalEarned = earnings?.total_paid ? String(Number(earnings.total_paid).toLocaleString()) : '0';
  const thisMonth = earnings?.this_month ? String(Number(earnings.this_month).toLocaleString()) : '0';
  const activeContracts = profile?.active_contracts || 0;
  const bidWinRate = profile?.bid_win_rate != null ? profile.bid_win_rate + '%' : '—';

  const profileCompleteness = [
    { label: 'Title',    done: !!profile.title },
    { label: 'Bio',      done: !!profile.bio },
    { label: 'Skills',   done: !!(profile.skills?.length) },
    { label: 'Rate',     done: !!profile.hourly_rate },
    { label: 'NIN',      done: profile.nin_status === 'verified' },
  ];
  const completePct = Math.round(profileCompleteness.filter(i => i.done).length / profileCompleteness.length * 100);

  return (
    <>
      {/* ── Profile completeness (only if < 80%) ── */}
      {completePct < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: FAUCET_EASING }}
          className="profile-progress"
        >
          <div className="profile-progress__header">
            <span className="profile-progress__label">⚡ Complete your profile to get hired faster</span>
            <span className="profile-progress__pct">{completePct}%</span>
          </div>
          <div className="profile-progress__bar">
            <div className="profile-progress__fill" style={{ width: completePct + '%' }} />
          </div>
          <div className="profile-progress__chips">
            {profileCompleteness.map(item => (
              <span key={item.label} className={`progress-chip progress-chip--${item.done ? 'done' : 'missing'}`}>
                {item.done ? '✓' : '○'} {item.label}
              </span>
            ))}
            <Link href="/profile/edit" className="progress-chip progress-chip--done" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
              Edit profile →
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Stat row ── */}
      <AnimatedSection delay={0.1} stagger={0.07}>
        <div className="stat-row">
          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--gold">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>₦</div>
              <div className="stat-card-v2__value" style={{ color: totalEarned === '0' ? 'var(--fg-tertiary)' : 'var(--amber, #F59E0B)' }}>
                {totalEarned === '0' ? '—' : <>₦{totalEarned}</>}
              </div>
              <div className="stat-card-v2__label">Total Earned</div>
              {totalEarned === '0' && <div className="stat-card-v2__sub">Complete your first job</div>}
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--gold">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>📅</div>
              <div className="stat-card-v2__value" style={{ color: thisMonth === '0' ? 'var(--fg-tertiary)' : 'var(--amber, #F59E0B)' }}>
                {thisMonth === '0' ? '—' : <>₦{thisMonth}</>}
              </div>
              <div className="stat-card-v2__label">This Month</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--green">
              <div className="stat-card-v2__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>📋</div>
              <div className="stat-card-v2__value" style={{ color: activeContracts > 0 ? 'var(--accent)' : 'var(--fg-tertiary)' }}>
                {activeContracts || '—'}
              </div>
              <div className="stat-card-v2__label">Active Contracts</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--copper">
              <div className="stat-card-v2__icon" style={{ background: 'var(--copper-alpha)', color: 'var(--copper)' }}>🎯</div>
              <div className="stat-card-v2__value" style={{ color: 'var(--copper)' }}>{bidWinRate}</div>
              <div className="stat-card-v2__label">Bid Win Rate</div>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Quick actions ── */}
      <AnimatedSection delay={0.15}>
        <div className="dash-three-col" style={{ marginBottom: '1.5rem' }}>
          <AnimatedStaggerItem>
            <Link href="/jobs" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>🔍</div>
              <div>
                <div className="quick-action__label">Find Work</div>
                <div className="quick-action__sub">Browse open jobs</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <Link href="/dashboard/my-bids" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'var(--copper-alpha)', color: 'var(--copper)' }}>📤</div>
              <div>
                <div className="quick-action__label">My Proposals</div>
                <div className="quick-action__sub">Track submitted bids</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <Link href="/dashboard/wallet" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>💳</div>
              <div>
                <div className="quick-action__label">Wallet</div>
                <div className="quick-action__sub">Earnings & payouts</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Two-column: matching jobs + activity ── */}
      <div className="dash-two-col">
        <AnimatedSection delay={0.2}>
          {profile.is_premium ? (
            <div className="dash-card" style={{ borderColor: 'var(--primary)', borderStyle: 'solid', borderWidth: 1 }}>
              <div className="dash-card__header">
                <span className="dash-card__title" style={{ color: 'var(--primary)' }}>✨ AI Smart Matches</span>
                <Link href="/jobs" className="dash-card__link">Browse all →</Link>
              </div>
              {smartMatchesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--fg-secondary)' }}>
                  <span className="pl-spinner" style={{ display: 'inline-block', marginBottom: '1rem' }} />
                  <div>Finding the best jobs for you...</div>
                </div>
              ) : smartMatches.length > 0 ? (
                smartMatches.map((job: any, i: number) => (
                  <AnimatedStaggerItem key={job.id || i}>
                    <div className="job-row-v2" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', background: 'rgba(59,130,246,0.03)' }}>
                      <Link href={'/jobs/' + job.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', textDecoration: 'none' }}>
                        <div className="job-row-v2__dot" style={{ background: 'var(--primary)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="job-row-v2__title">{job.title}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                            {job.job_type || 'Fixed'} · ₦{Number(job.budget || 0).toLocaleString()}
                          </div>
                        </div>
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--primary-alpha)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong>Why it&apos;s a match:</strong> {job.matchReason}
                      </div>
                    </div>
                  </AnimatedStaggerItem>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <div className="empty-state-icon">🤖</div>
                  <div className="empty-state-title">No AI matches found</div>
                  <div className="empty-state-desc">Update your profile to get better AI recommendations.</div>
                  <Link href="/profile/edit" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>Update profile →</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="dash-card">
              <div className="dash-card__header">
                <span className="dash-card__title">🎯 Recent Jobs</span>
                <Link href="/jobs" className="dash-card__link">Browse all →</Link>
              </div>
              {recentJobs.length > 0 ? (
                recentJobs.slice(0, 4).map((job: any, i: number) => (
                  <AnimatedStaggerItem key={job.id || i}>
                    <Link href={'/jobs/' + job.id} className="job-row-v2">
                      <div className="job-row-v2__dot" style={{ background: 'var(--accent)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="job-row-v2__title">{job.title}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                          {job.state || 'Remote'} · {job.job_type || 'Fixed'} · {job.bid_count || 0} bids
                        </div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--amber, #F59E0B)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        ₦{Number(job.budget || 0).toLocaleString()}
                      </div>
                    </Link>
                  </AnimatedStaggerItem>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No recent jobs</div>
                  <div className="empty-state-desc">Check back later for new opportunities.</div>
                </div>
              )}
            </div>
          )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">🔔 Recent Activity</span>
            </div>
            {notifications.length > 0 ? (
              <div className="feed-wrap">
                {notifications.slice(0, 7).map((n: any, i: number) => (
                  <div key={i} className="feed-item">
                    <div className="feed-dot" style={{ background: eventColor(n.type) }} />
                    {n.title && <div className="feed-title">{n.title}</div>}
                    <div className="feed-desc">{n.message || n.description}</div>
                    <div className="feed-time">{n.created_at ? new Date(n.created_at).toLocaleDateString('en-NG') : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">🔔</div>
                <div className="empty-state-title">No activity yet</div>
                <div className="empty-state-desc">Start bidding to see updates here.</div>
              </div>
            )}
          </div>
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
      {/* ── Stat row ── */}
      <AnimatedSection delay={0.1} stagger={0.07}>
        <div className="stat-row">
          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--green">
              <div className="stat-card-v2__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>💼</div>
              <div className="stat-card-v2__value" style={{ color: openJobs.length > 0 ? 'var(--accent)' : 'var(--fg-tertiary)' }}>
                {openJobs.length || '—'}
              </div>
              <div className="stat-card-v2__label">Active Jobs</div>
              {openJobs.length > 0 && <div className="stat-card-v2__sub">Accepting bids</div>}
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--copper">
              <div className="stat-card-v2__icon" style={{ background: 'var(--copper-alpha)', color: 'var(--copper)' }}>📥</div>
              <div className="stat-card-v2__value" style={{ color: totalBids > 0 ? 'var(--copper)' : 'var(--fg-tertiary)' }}>
                {totalBids || '—'}
              </div>
              <div className="stat-card-v2__label">Bids to Review</div>
              {totalBids > 0 && <div className="stat-card-v2__sub" style={{ color: 'var(--copper)' }}>Action needed</div>}
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--blue">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(74,140,255,0.1)', color: '#4A8CFF' }}>🤝</div>
              <div className="stat-card-v2__value" style={{ color: activeContracts > 0 ? '#4A8CFF' : 'var(--fg-tertiary)' }}>
                {activeContracts || '—'}
              </div>
              <div className="stat-card-v2__label">Contracts Ongoing</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--gold">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>💰</div>
              <div className="stat-card-v2__value" style={{ color: spentThisMonth > 0 ? 'var(--amber, #F59E0B)' : 'var(--fg-tertiary)' }}>
                {spentThisMonth > 0 ? <>₦{spentThisMonth.toLocaleString()}</> : '—'}
              </div>
              <div className="stat-card-v2__label">Total Budget Posted</div>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Needs Attention ── */}
      <AnimatedSection delay={0.13}>
        <AnimatedStaggerItem>
          {needsAttention.length > 0 ? (
            <div className="dash-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--copper)' }}>
              <div className="dash-card__header" style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="dash-card__title">
                  <span style={{ color: 'var(--copper)', fontSize: '1rem' }}>⚡</span>
                  Needs Attention
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                  {needsAttention.length} item{needsAttention.length > 1 ? 's' : ''}
                </span>
              </div>
              {needsAttention.slice(0, 4).map((item, i) => (
                <div key={i} className="attention-row">
                  <div
                    className="attention-dot"
                    style={{
                      background: item.type === 'bid' ? 'var(--copper)' : item.type === 'milestone' ? 'var(--accent)' : '#4A8CFF',
                      color:      item.type === 'bid' ? 'var(--copper)' : item.type === 'milestone' ? 'var(--accent)' : '#4A8CFF',
                    }}
                  />
                  <span className="attention-desc">{item.desc}</span>
                  <Link href={item.href} className="attention-btn">{item.action}</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-glow)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--fg-secondary)' }}>All caught up — no items need your attention right now.</span>
            </div>
          )}
        </AnimatedStaggerItem>
      </AnimatedSection>

      {/* ── Quick actions ── */}
      <AnimatedSection delay={0.16}>
        <div className="dash-three-col" style={{ marginBottom: '1.5rem' }}>
          <AnimatedStaggerItem>
            <Link href="/jobs/new" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'var(--copper-alpha)', color: 'var(--copper)' }}>✍️</div>
              <div>
                <div className="quick-action__label">Post a New Job</div>
                <div className="quick-action__sub">Get bids in minutes</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <Link href="/talent" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>👥</div>
              <div>
                <div className="quick-action__label">Browse Talent</div>
                <div className="quick-action__sub">Find verified providers</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <Link href="/dashboard/messages" className="quick-action">
              <div className="quick-action__icon" style={{ background: 'rgba(74,140,255,0.1)', color: '#4A8CFF' }}>💬</div>
              <div>
                <div className="quick-action__label">Messages</div>
                <div className="quick-action__sub">Chat with providers</div>
              </div>
            </Link>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      {/* ── Two-column: jobs table + activity ── */}
      <div className="dash-two-col">
        <AnimatedSection delay={0.2}>
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">📋 My Recent Jobs</span>
              <Link href="/dashboard/my-jobs" className="dash-card__link">View all →</Link>
            </div>
            {jobsList.length > 0 ? (
              jobsList.slice(0, 5).map((job: any, i: number) => (
                <AnimatedStaggerItem key={job.id || i}>
                  <Link href={'/jobs/' + job.id} className="job-row-v2">
                    <div
                      className="job-row-v2__dot"
                      style={{
                        background: job.status === 'open' ? 'var(--accent)'
                          : job.status === 'in_progress' || job.status === 'assigned' ? '#4A8CFF'
                          : 'var(--fg-tertiary)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="job-row-v2__title">{job.title}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                        {job.bid_count || 0} bid{(job.bid_count || 0) !== 1 ? 's' : ''} received
                      </div>
                    </div>
                    <span
                      className={'badge ' + (job.status === 'open' ? 'badge-success' : job.status === 'in_progress' || job.status === 'assigned' ? 'badge-info' : 'badge-neutral')}
                      style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}
                    >
                      {(job.status || 'open').replace('_', ' ')}
                    </span>
                  </Link>
                </AnimatedStaggerItem>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">💼</div>
                <div className="empty-state-title">No jobs yet</div>
                <div className="empty-state-desc">Post your first job and get bids from verified Nigerian professionals today.</div>
                <Link href="/jobs/new" className="btn btn-copper btn-sm" style={{ marginTop: '0.875rem' }}>Post a job →</Link>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">🔔 Activity Feed</span>
            </div>
            {notifications.length > 0 ? (
              <div className="feed-wrap">
                {notifications.slice(0, 7).map((n: any, i: number) => (
                  <div key={i} className="feed-item">
                    <div className="feed-dot" style={{ background: eventColor(n.type) }} />
                    {n.title && <div className="feed-title">{n.title}</div>}
                    <div className="feed-desc">{n.message || n.description}</div>
                    <div className="feed-time">{n.created_at ? new Date(n.created_at).toLocaleDateString('en-NG') : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">🔔</div>
                <div className="empty-state-title">No activity yet</div>
                <div className="empty-state-desc">Activity will appear here when you post jobs and receive bids.</div>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}

export default withAuth(DashboardPage);
