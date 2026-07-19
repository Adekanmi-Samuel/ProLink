'use client';

import { motion } from 'framer-motion';
import { pageVariants } from '../lib/motion';

/**
 * Wraps each page with fade transition
 */
export default function AnimatedPage({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
