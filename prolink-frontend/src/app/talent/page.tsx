'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { NIGERIAN_STATES } from '../../lib/states';
import gsap from 'gsap';

export default function TalentSearchPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  
  const [filters, setFilters] = useState({
    q: '',
    minRating: '',
    minRate: '',
    maxRate: '',
    availability: '',
    state: '',
    city: '',
    skillIds: [] as number[]
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/taxonomy/skills`).then(r => r.json());
        setSkills(res);
      } catch (err) {
        console.error('Failed to load skills', err);
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

  useEffect(() => {
    fetchProviders();
  }, [filters]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.minRate) params.append('minRate', filters.minRate);
      if (filters.maxRate) params.append('maxRate', filters.maxRate);
      if (filters.availability) params.append('availability', filters.availability);
      if (filters.state) params.append('state', filters.state);
      if (filters.city) params.append('city', filters.city);
      if (filters.skillIds.length > 0) params.append('skillIds', filters.skillIds.join(','));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/search/providers?${params.toString()}`).then(r => r.json());
      setProviders(response?.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skillId: number) => {
    setFilters(prev => {
      const newSkills = prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId];
      return { ...prev, skillIds: newSkills };
    });
  };

  const clearFilters = () => {
    setFilters({ q: '', minRating: '', minRate: '', maxRate: '', availability: '', state: '', city: '', skillIds: [] });
  };

  return (
    <div className="talent-page" ref={pageRef}>
      <div className="talent-header">
        <h1 className="talent-header__title">Find Talent</h1>
        <p className="talent-header__sub">Browse verified Nigerian professionals ready to work</p>
      </div>

      <div className="talent-layout">
        {/* Sidebar Filters */}
        <aside className="talent-filters">
          <div className="talent-filters__header">
            <h3 className="talent-filters__title">Filters</h3>
            <button onClick={clearFilters} className="talent-filters__clear">Clear all</button>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">Search</label>
            <input name="q" type="text" className="pl-input" placeholder="Name or skill..." value={filters.q} onChange={handleFilterChange} />
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">Weekly/Monthly Rate (&#x20A6;)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input name="minRate" type="number" className="pl-input" placeholder="Min" value={filters.minRate} onChange={handleFilterChange} />
              <input name="maxRate" type="number" className="pl-input" placeholder="Max" value={filters.maxRate} onChange={handleFilterChange} />
            </div>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">Min Rating</label>
            <select name="minRating" className="pl-input" value={filters.minRating} onChange={handleFilterChange}>
              <option value="">Any Rating</option>
              <option value="4.5">4.5 & up</option>
              <option value="4.0">4.0 & up</option>
              <option value="3.0">3.0 & up</option>
            </select>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">Availability</label>
            <select name="availability" className="pl-input" value={filters.availability} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="full_time">Full-Time</option>
              <option value="part_time">Part-Time</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">State</label>
            <select name="state" className="pl-input" value={filters.state} onChange={handleFilterChange}>
              <option value="">Any State</option>
              {Object.keys(NIGERIAN_STATES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">City / LGA</label>
            <select
              name="city" className="pl-input"
              value={filters.city} onChange={handleFilterChange}
              disabled={!filters.state}
            >
              <option value="">Any City/LGA</option>
              {filters.state && NIGERIAN_STATES[filters.state] ? NIGERIAN_STATES[filters.state].map((lga: string) => (
                <option key={lga} value={lga}>{lga}</option>
              )) : null}
              {filters.state && (!NIGERIAN_STATES[filters.state] || NIGERIAN_STATES[filters.state].length === 0) && <option value="Other">Other</option>}
            </select>
          </div>

          <div className="talent-filter-group">
            <label className="pl-label">Skills</label>
            <div className="talent-skills-list">
              {skills.map((s: any) => (
                <label key={s.id} className="talent-skill-check">
                  <input
                    type="checkbox"
                    checked={filters.skillIds.includes(s.id)}
                    onChange={() => toggleSkill(s.id)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <div className="talent-feed">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="pl-spinner" /></div>
          ) : providers.length > 0 ? (
            <div className="talent-list">
              {providers.map((p: any) => (
                <Link key={p.user_id} href={`/profiles/${p.user_id}`} className="talent-card">
                  <div className="talent-card__inner">
                    {/* Avatar */}
                    <div className="talent-card__avatar-wrap">
                      {p.profile_picture_url ? (
                        <img src={p.profile_picture_url} alt={p.full_name} className="talent-card__avatar" />
                      ) : (
                        <div className="talent-card__avatar-fallback">
                          {(p.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {p.is_featured && <span className="talent-card__featured">★</span>}
                    </div>

                    {/* Info */}
                    <div className="talent-card__info">
                      <h3 className="talent-card__name">
                        {p.full_name || 'Freelancer'}
                        {p.badges && p.badges.length > 0 && (
                          <span className="pl-badge pl-badge-warning" style={{ fontSize: '0.6rem', marginLeft: '0.4rem' }}>
                            {p.badges[0].replace('_', ' ')}
                          </span>
                        )}
                      </h3>
                      <p className="talent-card__title">{p.title || 'Freelancer'}</p>

                      <div className="talent-card__stats">
                        <span className="talent-card__rate">
                          &#x20A6;{p.hourly_rate ? Number(p.hourly_rate).toLocaleString() + ' / week or month' : 'Negotiable'}
                        </span>
                        <span className="talent-card__rating">
                          ⭐ {Number(p.rating_avg).toFixed(1)} ({p.review_count})
                        </span>
                        {p.job_success_score && (
                          <span className="talent-card__jss">✓ {p.job_success_score}% JSS</span>
                        )}
                      </div>

                      <p className="talent-card__bio line-clamp-2">{p.bio}</p>

                      {p.skills && p.skills.length > 0 && (
                        <div className="talent-card__skills">
                          {p.skills.slice(0, 5).map((s: any) => (
                            <span key={s.id} className="talent-card__skill">{s.name}</span>
                          ))}
                          {p.skills.length > 5 && (
                            <span className="talent-card__skill talent-card__skill--more">+{p.skills.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="talent-empty">
              <span style={{ fontSize: '2.5rem' }}>🔍</span>
              <p>No talent found matching your filters.</p>
              <button onClick={clearFilters} className="pl-btn pl-btn-secondary">Clear Filters</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .talent-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }
        .talent-header { margin-bottom: 2rem; }
        .talent-header__title {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--fg);
        }
        .talent-header__sub {
          color: var(--muted);
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .talent-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        /* Filters */
        .talent-filters {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          position: sticky;
          top: calc(var(--navbar-h) + 1rem);
        }
        .talent-filters__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .talent-filters__title { font-size: 1rem; font-weight: 700; color: var(--fg); }
        .talent-filters__clear {
          background: none; border: none; color: var(--primary);
          font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .talent-filter-group { margin-bottom: 1.25rem; }
        .talent-filter-group:last-child { margin-bottom: 0; }
        .talent-skills-list {
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .talent-skill-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--muted);
          cursor: pointer;
        }
        .talent-skill-check:hover { color: var(--fg); }
        .talent-skill-check input { accent-color: var(--primary); width: 14px; height: 14px; }

        /* Talent Cards */
        .talent-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .talent-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          transition: all 0.15s;
          display: block;
        }
        .talent-card:hover {
          border-color: var(--border2);
          background: var(--surface2);
        }
        .talent-card__inner {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }
        .talent-card__avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .talent-card__avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border2);
        }
        .talent-card__avatar-fallback {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .talent-card__featured {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          background: var(--warning);
          color: #000;
          border-radius: 50%;
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .talent-card__info {
          flex: 1;
          min-width: 0;
        }
        .talent-card__name {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--fg);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .talent-card__title {
          font-size: 0.85rem;
          color: var(--primary);
          font-weight: 500;
          margin-top: 2px;
          margin-bottom: 0.5rem;
        }
        .talent-card__stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.82rem;
          margin-bottom: 0.5rem;
        }
        .talent-card__rate { color: var(--fg); font-weight: 700; }
        .talent-card__rating { color: var(--warning); }
        .talent-card__jss { color: var(--success); font-weight: 600; }
        .talent-card__bio {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 0.65rem;
        }
        .talent-card__skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .talent-card__skill {
          background: var(--bg2);
          color: var(--fg2);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          border: 1px solid var(--border);
        }
        .talent-card__skill--more { color: var(--muted2); }

        .talent-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 4rem 2rem;
          text-align: center;
        }
        .talent-empty p { color: var(--muted); }

        @media (max-width: 768px) {
          .talent-layout { grid-template-columns: 1fr; }
          .talent-filters { position: static; }
          .talent-card__inner { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
