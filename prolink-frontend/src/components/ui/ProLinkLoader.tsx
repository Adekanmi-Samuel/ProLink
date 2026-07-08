import React from 'react';
import { motion } from 'framer-motion';

export default function ProLinkLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-4" style={{ minHeight: '300px', backgroundColor: 'transparent' }}>
      <motion.div 
        className="navbar-logo" 
        style={{ fontSize: '2.5rem', opacity: 0.9 }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.02, 0.95] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="navbar-logo-accent">Pro</span><span className="navbar-logo-fg">Link</span>
      </motion.div>
      {message && <div style={{ color: 'var(--fg-secondary)', fontSize: '0.95rem' }}>{message}</div>}
    </div>
  );
}
