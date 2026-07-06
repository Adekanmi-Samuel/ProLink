'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { AnimatedSection, AnimatedStaggerItem } from '../../components/AnimatedComponents';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

export default function AdminIndexPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-wrap" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-secondary)' }}>{error || 'Could not load admin stats.'}</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
        style={{ marginBottom: '2rem' }}
      >
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Platform Overview</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>Live statistics and platform health.</p>
      </motion.div>

      <AnimatedSection delay={0.1} stagger={0.08}>
        <div className="stat-grid-4">
          <AnimatedStaggerItem>
            <div className="stat-card stat-card--blue">
              <div className="stat-card__value">{stats.users.total.toLocaleString()}</div>
              <div className="stat-card__label">Total Users</div>
              <div className="stat-card__sub">{stats.users.clients} Clients · {stats.users.providers} Providers</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card stat-card--green">
              <div className="stat-card__value"><span className="naira">₦</span>{Number(stats.revenue.thisMonth || 0).toLocaleString()}</div>
              <div className="stat-card__label">Revenue (This Month)</div>
              <div className="stat-card__sub">Total: ₦{Number(stats.revenue.total || 0).toLocaleString()}</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card stat-card--copper">
              <div className="stat-card__value">{stats.jobs.active.toLocaleString()}</div>
              <div className="stat-card__label">Active Jobs</div>
              <div className="stat-card__sub">Total created: {stats.jobs.total.toLocaleString()}</div>
            </div>
          </AnimatedStaggerItem>

          <AnimatedStaggerItem>
            <div className="stat-card stat-card--gold">
              <div className="stat-card__value">{stats.verifications.pending + stats.disputes.pending}</div>
              <div className="stat-card__label">Pending Actions</div>
              <div className="stat-card__sub">{stats.verifications.pending} Verifications · {stats.disputes.pending} Disputes</div>
            </div>
          </AnimatedStaggerItem>
        </div>
      </AnimatedSection>

      <div className="dash-grid-2" style={{ marginTop: '2rem' }}>
        <AnimatedSection delay={0.2}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">Quick Actions</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Link href="/admin/verifications" className="card-base" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                <div style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: '0.25rem' }}>Review Verifications</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--fg-secondary)' }}>
                  {stats.verifications.pending > 0 ? <span style={{ color: 'var(--amber)' }}>{stats.verifications.pending} pending</span> : 'All caught up'}
                </div>
              </Link>
              
              <Link href="/admin/disputes" className="card-base" style={{ padding: '1.5rem', textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚖️</div>
                <div style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: '0.25rem' }}>Resolve Disputes</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--fg-secondary)' }}>
                  {stats.disputes.pending > 0 ? <span style={{ color: 'var(--danger)' }}>{stats.disputes.pending} open</span> : 'All resolved'}
                </div>
              </Link>
            </div>
          </AnimatedStaggerItem>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <AnimatedStaggerItem>
            <div className="dash-section-header">
              <div className="dash-section-title">System Status</div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="card-base" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="pulse-dot" style={{ background: 'var(--success)', width: 12, height: 12 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>All Systems Operational</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>Backend APIs and Database are running smoothly</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div className="pulse-dot" style={{ background: 'var(--success)', width: 12, height: 12 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Notifications Active</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>ntfy.sh service is connected</div>
                </div>
              </div>
            </div>
          </AnimatedStaggerItem>
        </AnimatedSection>
      </div>
    </div>
  );
}
