'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import api from '../../lib/api';
import withAuth from '../../components/withAuth';

import { useSocket } from '../../lib/SocketContext';

// ── Lazy-load heavy dashboard components to reduce initial bundle ──
const ProviderDashboard = dynamic(() => import('./ProviderDashboard').then(m => m.default || m), {
  loading: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 120 }} />)}
      {[1,2].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 200 }} />)}
    </div>
  ),
  ssr: false,
});
const ClientDashboard = dynamic(() => import('./ClientDashboard').then(m => m.default || m), {
  loading: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 120 }} />)}
      {[1,2].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: 200 }} />)}
    </div>
  ),
  ssr: false,
});

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
        if (contractsRes.status === 'fulfilled') {
          const cData = contractsRes.value.data;
          setMyJobs(Array.isArray(cData) ? cData : (cData?.jobs || []));
        }
        const chartData = earningsChartRes.status === 'fulfilled' ? earningsChartRes.value.data : [];

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
          <div>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--fg-secondary)', marginBottom: '1rem' }}>{error || 'Could not load your profile.'}</p>
              <button onClick={load} className="btn btn-outline">Retry</button>
            </div>
          </div>
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
      <div
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
                {openToWork ? 'Open to work' : 'Unavailable (Busy)'}
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
      </div>

      {/* ═══ ROLE-SPECIFIC CONTENT ═══ */}
      {isProvider ? (
        <ProviderDashboard
          profile={profile}
          earnings={earnings}
          recentJobs={recentJobs}
          notifications={notifications}
          myJobs={myJobs}
          earningsChart={earningsChart}
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

export default DashboardPage;
