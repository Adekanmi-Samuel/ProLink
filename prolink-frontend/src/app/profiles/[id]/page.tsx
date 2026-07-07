'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import ReportBlockMenu from '../../../components/ReportBlockMenu';

export default function ProfilePage() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const fetchProfile = async () => {
        try {
          const [profileRes, reviewsRes] = await Promise.all([
            api.get(`/profiles/${id}`),
            api.get(`/profiles/${id}/reviews`).catch(() => ({ data: [] }))
          ]);
          setProfileData(profileRes.data);
          setReviews(reviewsRes.data?.reviews || reviewsRes.data || []);
        } catch (error) {
          console.error('Failed to fetch profile', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
        <div className="pl-spinner" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="pl-container-sm">
          <div className="pl-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Profile not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const { full_name, bio, profile_picture_url, portfolio, rating_avg, review_count, badges, job_success_score, response_time_hours, location } = profileData;

  return (
    <div className="profile-page fade-up">
      <div className="pl-container-sm">
        
        {/* Main Profile Card */}
        <div className="pl-card profile-card">
          <div className="profile-card__header">
            <div className="profile-card__identity">
              <img 
                className="profile-card__avatar" 
                src={profile_picture_url || '/default-avatar.png'} 
                alt={full_name} 
              />
              <div className="profile-card__info">
                <h1 className="profile-card__name">{full_name || 'ProLink User'}</h1>
                <div className="profile-card__tags">
                  <span className="pl-badge pl-badge-provider">Service Provider</span>
                  {review_count > 0 && (
                    <div className="profile-card__rating">
                      <span className="star">★</span> {Number(rating_avg).toFixed(1)}
                      <span className="count">({review_count} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-card__actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    window.location.href = `/login?redirect=/dashboard/messages?to=${profileData.user_id}`;
                  } else {
                    window.location.href = `/dashboard/messages?to=${profileData.user_id}`;
                  }
                }}
                className="pl-btn pl-btn-primary"
              >
                Message Provider
              </button>
              <ReportBlockMenu userId={profileData.user_id} />
            </div>
          </div>

          <hr className="pl-divider" />

          {/* Stats & Credibility */}
          <div className="profile-stats">
            {badges && badges.length > 0 && (
              <div className="profile-stats__badges">
                {badges.map((b: string) => (
                  <span key={b} className="profile-badge">
                    🏆 {b.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            {job_success_score !== null && job_success_score !== undefined && (
              <div className="profile-stats__item success-score">
                ✓ {job_success_score}% Job Success
              </div>
            )}
            {response_time_hours && (
              <div className="profile-stats__item response-time">
                ⏱️ Replies in ~{response_time_hours}h
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="profile-section">
            <h2 className="profile-section__title">About</h2>
            {location && <div className="profile-location">📍 {location}</div>}
            <p className="profile-bio">{bio || 'This user hasn\'t added a bio yet.'}</p>
          </div>

          <hr className="pl-divider" />

          {/* Portfolio Section */}
          <div className="profile-section">
            <h2 className="profile-section__title">Portfolio</h2>
            {portfolio && portfolio.length > 0 ? (
              <div className="portfolio-grid">
                {portfolio.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="portfolio-item"
                    onClick={() => setSelectedPortfolio(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.image_url ? (
                      <img className="portfolio-item__img" src={item.image_url} alt={item.title} />
                    ) : (
                      <div className="portfolio-item__placeholder">No Image</div>
                    )}
                    <div className="portfolio-item__content">
                      <h3 className="portfolio-item__title">{item.title}</h3>
                      {item.description && <p className="portfolio-item__desc">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No portfolio items have been added yet.</p>
            )}
          </div>

          <hr className="pl-divider" />

          {/* Reviews Section */}
          <div className="profile-section">
            <h2 className="profile-section__title">Client Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="reviews-list">
                {reviews.map((review: any) => (
                  <div key={review.id} className="review-card">
                    <div className="review-card__header">
                      <div className="review-card__user">
                        <img className="review-card__avatar" src={review.reviewer_avatar || '/default-avatar.png'} alt={review.reviewer_name} />
                        <div>
                          <div className="review-card__name">{review.reviewer_name}</div>
                          {review.job_title && <div className="review-card__job">Job: {review.job_title}</div>}
                        </div>
                      </div>
                      <div className="review-card__stars">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="review-card__comment">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          padding: 2.5rem 1rem;
        }
        
        .profile-card {
          padding: 2.5rem;
          margin: 0 auto;
        }

        .profile-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .profile-card__identity {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .profile-card__avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--primary-alpha);
          background: var(--bg2);
        }

        .profile-card__name {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .profile-card__tags {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .profile-card__rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--fg);
        }
        .profile-card__rating .star {
          color: var(--warning);
          font-size: 1rem;
        }
        .profile-card__rating .count {
          color: var(--muted);
          font-weight: 400;
          margin-left: 0.15rem;
        }

        .profile-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2rem;
          align-items: center;
        }

        .profile-stats__badges {
          display: flex;
          gap: 0.5rem;
        }

        .profile-badge {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #fff;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }

        .profile-stats__item {
          font-size: 0.9rem;
          font-weight: 600;
        }
        .success-score { color: var(--success); }
        .response-time { color: var(--muted); }

        .profile-section {
          margin-bottom: 2.5rem;
        }
        .profile-section:last-child {
          margin-bottom: 0;
        }

        .profile-section__title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--muted2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .profile-location {
          font-size: 0.9rem;
          color: var(--muted);
          margin-bottom: 0.75rem;
        }

        .profile-bio {
          font-size: 1rem;
          color: var(--fg2);
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .profile-empty {
          color: var(--muted);
          font-size: 0.95rem;
          font-style: italic;
        }

        /* Portfolio Grid */
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .portfolio-item {
          display: flex;
          flex-direction: column;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .portfolio-item:hover {
          transform: translateY(-4px);
          border-color: var(--primary-alpha);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .portfolio-item__img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-bottom: 1px solid var(--border);
        }
        .portfolio-item__placeholder {
          width: 100%;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          color: var(--muted2);
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border);
        }
        .portfolio-item__content {
          padding: 1rem;
        }
        .portfolio-item__title {
          font-weight: 700;
          color: var(--primary);
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }
        .portfolio-item__desc {
          color: var(--muted);
          font-size: 0.85rem;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Reviews */
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .review-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
        }
        .review-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .review-card__user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .review-card__avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--surface);
        }
        .review-card__name {
          font-weight: 700;
          color: var(--fg);
          font-size: 0.95rem;
        }
        .review-card__job {
          font-size: 0.8rem;
          color: var(--primary-light);
          margin-top: 0.15rem;
        }
        .review-card__stars {
          color: var(--warning);
          font-size: 1.1rem;
          letter-spacing: 0.05em;
        }
        .review-card__comment {
          font-size: 0.95rem;
          color: var(--fg2);
          line-height: 1.6;
          font-style: italic;
        }

        @media (max-width: 600px) {
          .profile-card__header {
            flex-direction: column;
          }
          .profile-card__identity {
            flex-direction: column;
            text-align: center;
            width: 100%;
          }
          .profile-card__tags {
            justify-content: center;
          }
          .profile-stats {
            justify-content: center;
          }
        }
        
        /* Modal Styles */
        .portfolio-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
          padding: 1rem;
        }
        .portfolio-modal-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .portfolio-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }
        .portfolio-modal-close:hover {
          background: rgba(0,0,0,0.8);
        }
        .portfolio-modal-img {
          width: 100%;
          max-height: 55vh;
          object-fit: contain;
          background: #000;
        }
        .portfolio-modal-info {
          padding: 2rem;
        }
        .portfolio-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--fg);
          margin-bottom: 1rem;
        }
        .portfolio-modal-desc {
          color: var(--fg2);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
      `}</style>

      {/* Portfolio Modal */}
      {selectedPortfolio && (
        <div className="portfolio-modal-overlay" onClick={() => setSelectedPortfolio(null)}>
          <div className="portfolio-modal-content fade-up" onClick={e => e.stopPropagation()}>
            <button className="portfolio-modal-close" onClick={() => setSelectedPortfolio(null)}>✕</button>
            {selectedPortfolio.image_url && (
              <img src={selectedPortfolio.image_url} alt={selectedPortfolio.title} className="portfolio-modal-img" />
            )}
            <div className="portfolio-modal-info">
              <h2 className="portfolio-modal-title">{selectedPortfolio.title}</h2>
              <p className="portfolio-modal-desc">{selectedPortfolio.description}</p>
              {selectedPortfolio.project_url && (
                <a href={selectedPortfolio.project_url} target="_blank" rel="noopener noreferrer" className="pl-btn pl-btn-primary">
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
