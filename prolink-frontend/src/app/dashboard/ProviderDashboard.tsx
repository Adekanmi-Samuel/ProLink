'use client';

import Link from 'next/link';

import { AnimatedSection, AnimatedStaggerItem } from '../../components/AnimatedComponents';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function eventColor(type: string) {
  const m: Record<string, string> = { bid: '--copper', message: '--blue', milestone: '--accent', payment: '--gold', dispute: '--danger', system: '--info' };
  return `var(${m[type] || '--accent'})`;
}

export default function ProviderDashboard({ profile, earnings, recentJobs, notifications, myJobs, earningsChart, smartMatches, smartMatchesLoading }: any) {
  const totalEarned = earnings?.gross_earned ? String(Number(earnings.gross_earned).toLocaleString()) : '0';
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
      {/* -- Profile completeness (only if < 80%) -- */}
      {completePct < 80 && (
        <div
          className="profile-progress"
        >
          <div className="profile-progress__header">
            <span className="profile-progress__label">Complete your profile to get hired faster</span>
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
        </div>
      )}

      {/* -- Stat row -- */}
      <AnimatedSection delay={0.1} stagger={0.07}>
        <div className="stat-row">
          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--gold">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>₦</div>
              <div className="stat-card-v2__value" style={{ color: totalEarned === '0' ? 'var(--fg-tertiary)' : 'var(--amber, #F59E0B)' }}>
                {totalEarned === '0' ? '₦0' : <>₦{totalEarned}</>}
              </div>
              <div className="stat-card-v2__label">Total Earned</div>
              {totalEarned === '0' && <div className="stat-card-v2__sub">Complete your first job</div>}
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--gold">
              <div className="stat-card-v2__icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber, #F59E0B)' }}>📅</div>
              <div className="stat-card-v2__value" style={{ color: thisMonth === '0' ? 'var(--fg-tertiary)' : 'var(--accent)' }}>
                {thisMonth === '0' ? '₦0' : <>₦{thisMonth}</>}
              </div>
              <div className="stat-card-v2__label">This Month</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--green">
              <div className="stat-card-v2__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>📋</div>
              <div className="stat-card-v2__value" style={{ color: activeContracts > 0 ? 'var(--accent)' : 'var(--fg-tertiary)' }}>
                {activeContracts || '0'}
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

      {/* -- Quick actions -- */}
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

      {/* -- Two-column: matching jobs + activity -- */}
      <div className="dash-two-col">
        <AnimatedSection delay={0.2}>
          {profile.is_premium ? (
            <div className="dash-card" style={{ borderColor: 'var(--primary)', borderStyle: 'solid', borderWidth: 1 }}>
              <div className="dash-card__header">
                <span className="dash-card__title" style={{ color: 'var(--primary)' }}>AI Smart Matches</span>
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
                <span className="dash-card__title">Recent Jobs</span>
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
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">Recent Activity</span>
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
