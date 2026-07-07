'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { NIGERIAN_STATES } from '../../lib/states';
import gsap from 'gsap';

export default function JobsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [initialLoadError, setInitialLoadError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    categoryId: '',
    minBudget: '',
    maxBudget: '',
    jobType: '',
    state: '',
    city: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Track which jobs are currently being saved/unsaved
  const [savingJobId, setSavingJobId] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoadError('');
      try {
        const [catRes, recRes] = await Promise.all([
          api.get('/taxonomy/categories'),
          api.get('/recommendations/jobs').catch(() => ({ data: [] }))
        ]);
        setCategories(catRes.data);
        if (recRes.data && recRes.data.length > 0) {
          setRecommendedJobs(recRes.data);
          setActiveTab('recommended');
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
        setInitialLoadError('We could not load categories and recommendations right now.');
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
    setPage(1);
    fetchJobs(true);
  }, [filters]);

  useEffect(() => {
    if (page > 1) {
      fetchJobs(false);
    }
  }, [page]);

  const fetchJobs = async (reset = false) => {
    setLoading(true);
    setJobsError('');
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.state) params.append('state', filters.state);
      if (filters.city) params.append('city', filters.city);
      params.append('page', String(reset ? 1 : page));

      const response = await api.get(`/search/jobs?${params.toString()}`);
      const newJobs = response.data?.jobs || response.data || [];
      const paginationInfo = response.data?.pagination;
      
      setJobs(prev => reset ? newJobs : [...prev, ...newJobs]);
      setHasMore(paginationInfo?.hasMore ?? false);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      if (reset) setJobs([]);
      setJobsError('We could not load jobs right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    if (activeTab === 'recommended') setActiveTab('search');
  };

  const clearFilters = () => {
    setFilters({ q: '', categoryId: '', minBudget: '', maxBudget: '', jobType: '', state: '', city: '' });
  };

  const displayJobs = activeTab === 'recommended' ? recommendedJobs : jobs;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const handleSaveJob = async (jobId: number, currentSaved: boolean) => {
    setSavingJobId(jobId);
    try {
      if (currentSaved) {
        await api.delete(`/saved_jobs/${jobId}`);
      } else {
        await api.post('/saved_jobs', { jobId });
      }
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, isSaved: !currentSaved } : job
      ));
      setRecommendedJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, isSaved: !currentSaved } : job
      ));
    } catch (error) {
      console.error('Failed to save/unsave job:', error);
    } finally {
      setSavingJobId(null);
    }
  };

  const jobCards = displayJobs.map((job: any) => {
    return (
      <Link key={job.id} href={`/jobs/${job.id}`} className="job-card">
        <div className="job-card__top">
          <div className="job-card__meta">
            <span className="job-card__time">{timeAgo(job.posted_at)}</span>
            {job.job_type === 'fixed' ? (
              <span className="pl-badge pl-badge-primary">Fixed</span>
            ) : (
              <span className="pl-badge pl-badge-warning">Milestones</span>
            )}
          </div>
          <div className="job-card__budget">&#x20A6;{Number(job.budget || 0).toLocaleString()}</div>
        </div>

        <h3 className="job-card__title">{job.title}</h3>
        
        <p className="job-card__desc line-clamp-2">{job.description}</p>

        {job.skills && job.skills.length > 0 && (
          <div className="job-card__skills">
            {job.skills.slice(0, 5).map((s: any) => (
              <span key={s.id} className="job-card__skill">{s.name}</span>
            ))}
            {job.skills.length > 5 && (
              <span className="job-card__skill job-card__skill--more">+{job.skills.length - 5}</span>
            )}
          </div>
        )}

        <div className="job-card__bottom">
          <span className="job-card__client">
            {job.client?.profile?.full_name || 'Client'}
            {job.client?.email_verified && (
              <span className="job-card__verified" title="Verified Client">✓</span>
            )}
          </span>
          {job._count?.bids !== undefined && (
            <span className="job-card__bids">{job._count.bids} bid{job._count.bids !== 1 ? 's' : ''}</span>
          )}
          <button
            className={`job-card__save ${job.isSaved ? 'job-card__save--saved' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveJob(job.id, job.isSaved);
            }}
            disabled={savingJobId === job.id}
            aria-label={job.isSaved ? 'Remove from saved jobs' : 'Save job'}
          >
            {savingJobId === job.id ? (
              <span className="pl-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : job.isSaved ? (
              '🔖'
            ) : (
              '🔖'
            )}
          </button>
        </div>
      </Link>
    );
  });

  return (
    <div className="jobs-page" ref={pageRef} style={{ paddingTop: '80px' }}>
      {/* Page Header */}
      <div className="jobs-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="jobs-header__title">Find Work</h1>
            <p className="jobs-header__sub">Browse open projects and submit your proposals</p>
          </div>
          <button 
            className="jobs-filters__toggle pl-btn pl-btn-secondary" 
            onClick={() => setFiltersOpen(true)}
            style={{ display: 'none', flexShrink: 0 }}
          >
            ☰ Filters
          </button>
        </div>
      </div>

      <div className="jobs-layout">
        {/* Sidebar Filters */}
        <aside className={`jobs-filters ${filtersOpen ? 'jobs-filters--open' : ''}`}>
          <div className="jobs-filters__header">
            <h3 className="jobs-filters__title">Filters</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={clearFilters} className="jobs-filters__clear">Clear all</button>
              <button 
                className="jobs-filters__close" 
                onClick={() => setFiltersOpen(false)}
                style={{ display: 'none', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}
                aria-label="Close filters"
              >✕</button>
            </div>
          </div>

          <div className="jobs-filter-group">
            <label className="pl-label">Search</label>
            <input
              name="q" type="text" className="pl-input"
              placeholder="Keywords..."
              value={filters.q} onChange={handleFilterChange}
            />
          </div>

          <div className="jobs-filter-group">
            <label className="pl-label">Category</label>
            <select
              name="categoryId" className="pl-input"
              value={filters.categoryId} onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="jobs-filter-group">
            <label className="pl-label">Job Type</label>
            <select
              name="jobType" className="pl-input"
              value={filters.jobType} onChange={handleFilterChange}
            >
              <option value="">Any Type</option>
              <option value="fixed">Fixed Price</option>
              <option value="milestone">Milestones</option>
            </select>
          </div>

          <div className="jobs-filter-group">
            <label className="pl-label">Budget Range (&#x20A6;)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input name="minBudget" type="number" className="pl-input" placeholder="Min" value={filters.minBudget} onChange={handleFilterChange} />
              <input name="maxBudget" type="number" className="pl-input" placeholder="Max" value={filters.maxBudget} onChange={handleFilterChange} />
            </div>
          </div>
          <div className="jobs-filter-group">
            <label className="pl-label">State</label>
            <select
              name="state" className="pl-input"
              value={filters.state} onChange={handleFilterChange}
            >
              <option value="">Any State</option>
              {Object.keys(NIGERIAN_STATES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="jobs-filter-group">
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

        </aside>

        {/* Main Feed */}
        <div className="jobs-feed">
          {initialLoadError && (
            <div className="jobs-alert jobs-alert--warning">
              {initialLoadError}
            </div>
          )}

          {/* Tabs */}
          <div className="jobs-tabs">
            <button
              onClick={() => setActiveTab('search')}
              className={`jobs-tab ${activeTab === 'search' ? 'jobs-tab--active' : ''}`}
            >
              All Jobs
            </button>
            {recommendedJobs.length > 0 && (
              <button
                onClick={() => setActiveTab('recommended')}
                className={`jobs-tab ${activeTab === 'recommended' ? 'jobs-tab--active' : ''}`}
              >
                Recommended
              </button>
            )}
          </div>

          {loading && activeTab === 'search' ? (
            <div className="jobs-loading">
              <div className="pl-spinner" />
            </div>
          ) : jobsError && activeTab === 'search' ? (
            <div className="jobs-empty">
              <span className="jobs-empty__icon">⚠️</span>
              <p>{jobsError}</p>
              <button onClick={fetchJobs} className="pl-btn pl-btn-secondary">Try Again</button>
            </div>
          ) : displayJobs.length > 0 ? (
            <div className="jobs-list">
              {jobCards}
              {hasMore && activeTab === 'search' && !loading && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    onClick={() => setPage(p => p + 1)} 
                    className="pl-btn pl-btn-secondary"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="jobs-empty">
              <span className="jobs-empty__icon">🔎</span>
              <p className="jobs-empty__text">No jobs found - try adjusting your filters or search terms</p>
              <button onClick={clearFilters} className="pl-btn pl-btn-secondary">Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
