'use client';

import Link from 'next/link';
import { AnimatedSection, AnimatedStaggerItem } from '../../components/AnimatedComponents';

function eventColor(type: string) {
  const m: Record<string, string> = { bid: '--copper', message: '--blue', milestone: '--accent', payment: '--gold', dispute: '--danger', system: '--info' };
  return `var(${m[type] || '--accent'})`;
}

export default function ClientDashboard({ profile, notifications, myJobs }: any) {
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
      {/* -- Stat row -- */}
      <AnimatedSection delay={0.1} stagger={0.07}>
        <div className="stat-row">
          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--green">
              <div className="stat-card-v2__icon" style={{ background: 'var(--accent-alpha)', color: 'var(--accent)' }}>💼</div>
              <div className="stat-card-v2__value" style={{ color: openJobs.length > 0 ? 'var(--accent)' : 'var(--fg-tertiary)' }}>
                {openJobs.length || '0'}
              </div>
              <div className="stat-card-v2__label">Active Jobs</div>
              {openJobs.length > 0 && <div className="stat-card-v2__sub">Accepting bids</div>}
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card-v2 stat-card-v2--copper">
              <div className="stat-card-v2__icon" style={{ background: 'var(--copper-alpha)', color: 'var(--copper)' }}>📥</div>
              <div className="stat-card-v2__value" style={{ color: totalBids > 0 ? 'var(--copper)' : 'var(--fg-tertiary)' }}>
                {totalBids || '0'}
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

      {/* -- Needs Attention -- */}
      <AnimatedSection delay={0.13}>
        <AnimatedStaggerItem>
          {needsAttention.length > 0 ? (
            <div className="dash-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--copper)' }}>
              <div className="dash-card__header" style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="dash-card__title">
                  <span style={{ color: 'var(--copper)', fontSize: '1rem' }}>⚡</span>
                  {' '}Needs Attention
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

      {/* -- Quick actions -- */}
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

      {/* -- Two-column: jobs table + activity -- */}
      <div className="dash-two-col">
        <AnimatedSection delay={0.2}>
          <div className="dash-card">
            <div className="dash-card__header">
              <span className="dash-card__title">My Recent Jobs</span>
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
              <span className="dash-card__title">Activity Feed</span>
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
