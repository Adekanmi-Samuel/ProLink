'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <motion.div 
        className="flex items-center gap-3"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.5rem', boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.4)' }}>
          P
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--fg)', letterSpacing: '-0.5px' }}>
          ProLink
        </span>
      </motion.div>
    </div>
  );
}
