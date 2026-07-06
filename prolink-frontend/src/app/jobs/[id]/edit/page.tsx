'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';
import withAuth from '../../../../components/withAuth';

function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({ title: '', description: '', budget: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        const job = res.data;
        setForm({
          title: job.title || '',
          description: job.description || '',
          budget: job.budget ? String(job.budget) : '',
        });
      } catch (err: any) {
        setError(err?.response?.data?.msg || 'Failed to load job.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/jobs/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget ? parseFloat(form.budget) : undefined,
      });
      router.push(`/jobs/${id}`);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Failed to update job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pl-spinner" />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="pl-page" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
        <Link href="/dashboard/my-jobs" className="pl-btn pl-btn-secondary">Back to My Jobs</Link>
      </div>
    );
  }

  return (
    <div className="pl-page fade-up" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/jobs/${id}`} style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>← Back to Job</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--fg)' }}>Edit Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="pl-card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--fg)', fontSize: '0.9rem' }}>Job Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="pl-input"
            style={{ width: '100%' }}
            placeholder="e.g. Build a React Dashboard"
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--fg)', fontSize: '0.9rem' }}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="pl-input"
            rows={6}
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Describe the job in detail..."
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--fg)', fontSize: '0.9rem' }}>Budget (₦)</label>
          <input
            name="budget"
            type="number"
            value={form.budget}
            onChange={handleChange}
            className="pl-input"
            style={{ width: '100%' }}
            placeholder="e.g. 150000"
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Link href={`/jobs/${id}`} className="pl-btn" style={{ textDecoration: 'none' }}>Cancel</Link>
          <button type="submit" className="pl-btn pl-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default withAuth(EditJobPage);
