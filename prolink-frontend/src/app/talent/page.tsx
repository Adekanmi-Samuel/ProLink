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
    <div className="page" ref={pageRef}>
      <div className="wrap" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="talent-header" style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">Find Talent</h1>
          <p className="page-sub">Browse verified Nigerian professionals ready to work</p>
        </div>

        <div className="talent-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Sidebar Filters */}
          <aside className="talent-filters" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', position: 'sticky', top: 'calc(var(--navbar-h) + 1rem)' }}>
            <div className="talent-filters__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="talent-filters__title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg)' }}>Filters</h3>
              <button onClick={clearFilters} className="talent-filters__clear" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Clear all</button>
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Search</label>
              <input name="q" type="text" className="field" placeholder="Name or skill..." value={filters.q} onChange={handleFilterChange} />
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Weekly/Monthly Rate (&#x20A6;)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input name="minRate" type="number" className="field" placeholder="Min" value={filters.minRate} onChange={handleFilterChange} />
                <input name="maxRate" type="number" className="field" placeholder="Max" value={filters.maxRate} onChange={handleFilterChange} />
              </div>
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Min Rating</label>
              <select name="minRating" className="field" value={filters.minRating} onChange={handleFilterChange}>
                <option value="">Any Rating</option>
                <option value="4.5">4.5 & up</option>
                <option value="4.0">4.0 & up</option>
                <option value="3.0">3.0 & up</option>
              </select>
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Availability</label>
              <select name="availability" className="field" value={filters.availability} onChange={handleFilterChange}>
                <option value="">Any</option>
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="as_needed">As Needed</option>
              </select>
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">State</label>
              <select name="state" className="field" value={filters.state} onChange={handleFilterChange}>
                <option value="">Any State</option>
                {Object.keys(NIGERIAN_STATES).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">City / LGA</label>
              <select
                name="city" className="field"
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

            <div className="talent-filter-group" style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Skills</label>
              <div className="talent-skills-list" style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {skills.map((s: any) => (
                  <label key={s.id} className="talent-skill-check" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.skillIds.includes(s.id)}
                      onChange={() => toggleSkill(s.id)}
                      style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
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
              <div className="talent-grid">
                {providers.map((p: any) => (
                  <Link key={p.user_id} href={`/profiles/${p.user_id}`} className="talent-card">
                    <div className="talent-card__header">
                      {p.profile_picture_url ? (
                        <img src={p.profile_picture_url} alt={p.full_name} className="talent-card__avatar" />
                      ) : (
                        <div className="talent-card__avatar" style={{ background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                          {(p.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      {p.is_featured && <span className="talent-card__featured" style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, background: 'var(--warning)', color: '#000', borderRadius: '50%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>★</span>}
                    </div>

                    <h3 className="talent-card__name">
                      {p.full_name || 'Freelancer'}
                      {p.badges && p.badges.length > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.6rem', marginLeft: '0.4rem' }}>
                          {p.badges[0].replace('_', ' ')}
                        </span>
                      )}
                    </h3>
                    <p className="talent-card__title">{p.title || 'Freelancer'}</p>

                    <div className="talent-card__stats">
                      <span className="talent-card__rate">
                        &#x20A6;{p.hourly_rate ? Number(p.hourly_rate).toLocaleString() + ' / week or month' : 'Negotiable'}
                      </span>
                      <span className="talent-card__rating" style={{ color: 'var(--warning)' }}>
                        ⭐ {Number(p.rating_avg).toFixed(1)} ({p.review_count})
                      </span>
                      {p.job_success_score && (
                        <span className="talent-card__jss" style={{ color: 'var(--success)', fontWeight: 600 }}>✓ {p.job_success_score}% JSS</span>
                      )}
                    </div>

                    {p.skills && p.skills.length > 0 && (
                      <div className="talent-card__skills">
                        {p.skills.slice(0, 5).map((s: any) => (
                          <span key={s.id} className="badge badge-neutral">{s.name}</span>
                        ))}
                        {p.skills.length > 5 && (
                          <span className="badge badge-neutral">+{p.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="talent-card__action">
                      View Profile →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No talent found</div>
                <div className="empty-state-desc">Try adjusting your filters to see more results.</div>
                <button onClick={clearFilters} className="btn btn-outline btn-sm">Clear Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
