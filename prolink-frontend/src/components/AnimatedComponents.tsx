'use client';

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, fadeIn, scaleIn } from '../lib/motion';

/* ── AnimatedSection — staggered children ── */
export function AnimatedSection({ children, className, style, delay = 0.1, stagger = 0.07, once = true }: any) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatedCard — fade + slide up ── */
export function AnimatedCard({ children, className, style, index = 0, as = 'div' }: any) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      variants={fadeUp}
      custom={index}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  );
}

/* ── AnimatedFadeIn — simple opacity ── */
export function AnimatedFadeIn({ children, className, style, delay = 0 }: any) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatedScaleIn ── */
export function AnimatedScaleIn({ children, className, style }: any) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatedCounter ── */
export function AnimatedCounter({ value, suffix = '', className }: any) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, mass: 0.8 }}
      className={className}
    >
      {value}{suffix}
    </motion.span>
  );
}

/* ── AnimatedHoverCard ── */
export function AnimatedHoverCard({ children, className, style, href, onClick }: any) {
  const Comp = href ? 'a' : 'div';
  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22,  1,  0.36,  1] as any } }}
      whileTap={{ scale: 0.98 }}
      className={className}
      style={style}
    >
      <Comp href={href} onClick={onClick} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        {children}
      </Comp>
    </motion.div>
  );
}

/* ── AnimatedButton ── */
export function AnimatedButton({ children, className, style, onClick, disabled, type = 'button', href }: any) {
  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ y: -2, transition: { duration: 0.25, ease: [0.22,  1,  0.36,  1] as any } }}
        whileTap={{ scale: 0.97 }}
        className={className}
        style={style}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2, transition: { duration: 0.25, ease: [0.22,  1,  0.36,  1] as any } }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}

/* ── AnimatedStaggerItem — for use inside AnimatedSection ── */
export function AnimatedStaggerItem({ children, className, style }: any) {
  return (
    <motion.div
      variants={fadeUp}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatedStatusDot — pulsing ── */
export function AnimatedStatusDot({ active = true }: any) {
  return (
    <motion.span
      className="pulse-dot"
      animate={active ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ backgroundColor: active ? 'var(--accent)' : 'var(--fg-tertiary)' }}
    />
  );
}
