'use client';

import { motion } from 'framer-motion';

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem', paddingTop: 'calc(var(--navbar-h) + 2rem)' }}>
      {/* Skeleton header */}
      <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 24 }} />
      <div className="skeleton" style={{ width: 340, height: 16, marginBottom: 32 }} />
      
      {/* Skeleton widgets grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '40%', height: 24 }} />
          </div>
        ))}
      </div>
      
      {/* Skeleton table */}
      <div className="card" style={{ padding: 24 }}>
        <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 16 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '30%', height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
