'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import ReportBlockMenu from '../../../components/ReportBlockMenu';
import ProLinkLoader from '../../../components/ui/ProLinkLoader';

export default function ProfilePage() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          const [profileRes, reviewsRes] = await Promise.all([
            api.get(`/profiles/${id}`),
            api.get(`/profiles/${id}/reviews`).catch(() => ({ data: [] })),
          ]);
          setProfileData(profileRes.data);
          setReviews(reviewsRes.data?.reviews || reviewsRes.data || []);
        } catch { /* ignore */ } finally {
          setLoading(false);
        }
      })();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ paddingTop: '80px', minHeight: '60vh' }}>
        <ProLinkLoader />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profile not found</h2>
        <p style={{ color: 'var(--fg-secondary)' }}>The user you are looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const {
    full_name, bio, profile_picture_url, portfolio, rating_avg, review_count,
    badges, job_success_score, response_time_hours, city, state,
    title, hourly_rate, skills, user_type,
  } = profileData;

  const isProvider = user_type === 'provider';
  const location = [city, state].filter(Boolean).join(', ');

  return (
    <div className="page">
      <style>{`
        @media (max-width: 600px) {
          .profile-card__header { flex-direction: column; align-items: flex-start; }
          .profile-card__actions { align-self: flex-end; margin-top: 0.5rem; }
          .profile-card__identity { flex-direction: column; text-align: center; width: 100%; align-items: center; }
          .profile-card__tags { justify-content: center; }
          .profile-stats { justify-content: center; }
        }
        .profile-page { padding: calc(var(--navbar-h, 68px) + 1.5rem) 1rem 3rem; }
        .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); gap: 1.25rem; }
      `}</style>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'calc(var(--navbar-h) + 1.5rem) 1rem 3rem' }}>
        {/* ── Profile Card ── */}
        <div className="card-base" style={{ padding: '1.5rem 2rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={profile_picture_url || '/default-avatar.png'}
                alt={full_name}
                style={{
                  width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid var(--accent-alpha)', background: 'var(--surface-hover)',
                }}
              />
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                  {full_name || 'ProLink User'}
                </h1>
                {title && isProvider && (
                  <p style={{ color: 'var(--fg-secondary)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                    {title}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-block', padding: '0.15rem 0.65rem', borderRadius: 999,
                      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isProvider ? 'var(--accent)' : 'var(--info)',
                      background: isProvider ? 'var(--accent-alpha)' : 'var(--info-bg)',
                    }}
                  >
                    {user_type === 'client' ? 'Client' : user_type === 'admin' ? 'Admin' : 'Service Provider'}
                  </span>
                  {review_count > 0 && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--warning)' }}>★</span>{' '}
                      {Number(rating_avg).toFixed(1)}
                      <span style={{ color: 'var(--fg-tertiary)', fontWeight: 400, marginLeft: 4 }}>
                        ({review_count})
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  const base = token ? `/dashboard/messages?to=${profileData.user_id}` : `/login?redirect=/dashboard/messages?to=${profileData.user_id}`;
                  window.location.href = base;
                }}
                className="btn btn-accent btn-sm"
              >
                Message
              </button>
              <ReportBlockMenu userId={profileData.user_id} />
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        {(isProvider || (badges && badges.length > 0)) && (
          <div className="card-base" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              {badges && badges.length > 0 && badges.map((b: string) => (
                <span key={b} style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#fff',
                  padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.7rem',
                  fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  🏆 {b.replace(/_/g, ' ')}
                </span>
              ))}
              {isProvider && job_success_score != null && (
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)' }}>
                  ✓ {job_success_score}% Success
                </span>
              )}
              {isProvider && response_time_hours && (
                <span style={{ fontSize: '0.82rem', color: 'var(--fg-secondary)' }}>
                  ⏱ ~{response_time_hours}h reply
                </span>
              )}
              {isProvider && hourly_rate && (
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--amber)', fontFamily: "'JetBrains Mono', monospace" }}>
                  ₦{parseFloat(hourly_rate).toLocaleString()}/hr
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── About ── */}
        <div className="card-base" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', marginBottom: '0.75rem' }}>
            About
          </h2>
          {location && (
            <div style={{ marginBottom: '0.75rem', fontSize: '0.88rem', color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {location}
            </div>
          )}
          <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>
            {bio || "This user hasn't added a bio yet."}
          </p>

          {isProvider && skills && skills.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {skills.map((s: any) => (
                  <span key={s.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    padding: '0.25rem 0.75rem', borderRadius: 999,
                    fontSize: '0.78rem', color: 'var(--fg)',
                  }}>
                    {s.skill?.name || s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Portfolio ── */}
        <div className="card-base" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', marginBottom: '0.75rem' }}>
            Portfolio
          </h2>
          {portfolio && portfolio.length > 0 ? (
            <div className="portfolio-grid">>
              {portfolio.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPortfolio(item)}
                  style={{
                    cursor: 'pointer', overflow: 'hidden',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--surface)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderBottom: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', color: 'var(--fg-tertiary)', fontSize: '0.82rem' }}>
                      No Image
                    </div>
                  )}
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: '0.75rem', color: 'var(--fg-secondary)', lineHeight: 1.4 }}>{item.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.88rem', fontStyle: 'italic' }}>
              No portfolio items have been added yet.
            </p>
          )}
        </div>

        {/* ── Reviews ── */}
        <div className="card-base" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', marginBottom: '0.75rem' }}>
            Reviews
          </h2>
          {reviews && reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((review: any) => (
                <div key={review.id} style={{
                  padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={review.reviewer_avatar || '/default-avatar.png'}
                        alt={review.reviewer_name}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface-hover)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{review.reviewer_name}</div>
                        {review.job_title && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Job: {review.job_title}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ color: 'var(--warning)', fontSize: '0.95rem', letterSpacing: '0.03em' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--fg-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.88rem', fontStyle: 'italic' }}>
              No reviews yet.
            </p>
          )}
        </div>
      </div>

      {/* ── Portfolio Modal ── */}
      {selectedPortfolio && (
        <div
          onClick={() => setSelectedPortfolio(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              width: '100%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={() => setSelectedPortfolio(null)}
              style={{
                position: 'absolute', top: '0.75rem', right: '0.75rem',
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                fontSize: '1rem', zIndex: 10,
              }}
            >
              ✕
            </button>
            {selectedPortfolio.image_url && (
              <img src={selectedPortfolio.image_url} alt={selectedPortfolio.title} style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', background: '#000' }} />
            )}
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedPortfolio.title}</h2>
              <p style={{ color: 'var(--fg-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedPortfolio.description}</p>
              {selectedPortfolio.project_url && (
                <a href={selectedPortfolio.project_url} target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-sm">
                  View Project ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
