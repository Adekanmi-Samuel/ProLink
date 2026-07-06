'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]" style={{ padding: '5rem 1.25rem 2rem' }}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="spinner"
          style={{ width: 32, height: 32 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
        />
        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-heading), sans-serif' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}
