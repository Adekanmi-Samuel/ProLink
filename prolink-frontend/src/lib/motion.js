/**
 * ProLink Motion System — Premium animation variants
 * Curve: cubic-bezier(0.22, 1, 0.36, 1) — premium ease-out
 *
 * Usage: import { fadeUp, staggerContainer, pageTransition } from '@/lib/motion'
 *        <motion.div variants={fadeUp} ... />
 */

/* ── Easing presets ── */
const ease = [0.22, 1, 0.36, 1];
const easeOut = { ease: 'easeOut' };

/* ── Transition presets ── */
export const transitions = {
  spring: {
    type: 'spring',
    stiffness: 260,
    damping: 24,
    mass: 0.8,
  },
  springBouncy: {
    type: 'spring',
    stiffness: 180,
    damping: 14,
    mass: 0.6,
  },
  smooth: { duration: 0.5, ease },
  fast: { duration: 0.25, ease },
  slow: { duration: 0.7, ease },
  stagger: { staggerChildren: 0.08, delayChildren: 0.1 },
  staggerFast: { staggerChildren: 0.04, delayChildren: 0.05 },
  staggerSlow: { staggerChildren: 0.12, delayChildren: 0.15 },
};

/* ════════════════════════════════════════════════════════════
   ENTRANCE VARIANTS (use via whileInView or variants)
   ════════════════════════════════════════════════════════════ */

/** Fade + slide up — most common entrance */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

/** Fade + slide up with blur — premium reveal */
export const blurReveal = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, ease },
  },
};

/** Simple fade in */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
};

/** Fade in from downside */
export const fadeDown = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

/** Slide from left */
export const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitions.smooth },
};

/** Slide from right */
export const fadeRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitions.smooth },
};

/** Scale in from center */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: transitions.smooth },
};

/** Zoom out reveal */
export const zoomIn = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease } },
};

/** Slide up — heavier entrance */
export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

/* ════════════════════════════════════════════════════════════
   STAGGER CONTAINERS (wrap around children using variants)
   ════════════════════════════════════════════════════════════ */

export const staggerContainer = {
  hidden: {},
  visible: { transition: transitions.stagger },
};

export const staggerContainerFast = {
  hidden: {},
  visible: { transition: transitions.staggerFast },
};

export const staggerContainerSlow = {
  hidden: {},
  visible: { transition: transitions.staggerSlow },
};

/* ════════════════════════════════════════════════════════════
   UI COMPONENT VARIANTS
   ════════════════════════════════════════════════════════════ */

/** Card hover — lift + glow */
export const cardHover = {
  rest: { y: 0, boxShadow: 'var(--shadow)' },
  hover: {
    y: -6,
    rotateX: 1,
    boxShadow: 'var(--shadow-lg)',
    transition: { duration: 0.3, ease },
  },
};

/** Button hover */
export const buttonHover = {
  rest: { y: 0 },
  hover: { y: -2, transition: { duration: 0.25, ease } },
};

/** Floating animation (gentle bob) */
export const floating = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

/** Pulse glow */
export const pulseGlow = {
  animate: {
    boxShadow: ['0 0 0 0 var(--accent-glow)', '0 0 20px 4px var(--accent-glow)', '0 0 0 0 var(--accent-glow)'],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ════════════════════════════════════════════════════════════
   NAVIGATION / OVERLAY VARIANTS
   ════════════════════════════════════════════════════════════ */

export const navbarVariants = {
  hidden: { y: -80, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { ...transitions.smooth, duration: 0.6 } },
};

export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.fast },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...transitions.smooth, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.94, y: 20, transition: transitions.fast },
};

export const drawerVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { ...transitions.smooth, duration: 0.4 } },
  exit: { x: '-100%', opacity: 0, transition: transitions.fast },
};

export const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { ...transitions.smooth, duration: 0.25 } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: transitions.fast },
};

/* ════════════════════════════════════════════════════════════
   PAGE TRANSITIONS
   ════════════════════════════════════════════════════════════ */

export const pageTransition = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)', scale: 0.98 },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)', scale: 1,
    transition: { duration: 0.55, ease },
  },
  exit: {
    opacity: 0, y: -20, filter: 'blur(6px)', scale: 0.99,
    transition: { duration: 0.3, ease },
  },
};

export const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease } },
  exit: { opacity: 0, transition: { duration: 0.2, ease } },
};

/* ════════════════════════════════════════════════════════════
   COUNTER / NUMBER VARIANTS
   ════════════════════════════════════════════════════════════ */

export const counterVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { ...transitions.springBouncy } },
};

/* ════════════════════════════════════════════════════════════
   LIST VARIANTS
   ════════════════════════════════════════════════════════════ */

export const listAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const listItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

/* ════════════════════════════════════════════════════════════
   MESSAGE VARIANTS
   ════════════════════════════════════════════════════════════ */

export const messageIn = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease } },
};

export const messageOut = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease } },
};

/* ════════════════════════════════════════════════════════════
   NOTIFICATION / TOAST VARIANTS
   ════════════════════════════════════════════════════════════ */

export const notificationAnimation = {
  hidden: { opacity: 0, x: 60, scale: 0.9 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { ...transitions.spring, stiffness: 200 } },
  exit: { opacity: 0, x: 60, scale: 0.9, transition: transitions.fast },
};

export const toastAnimation = {
  hidden: { opacity: 0, y: -16, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

/* ════════════════════════════════════════════════════════════
   HERO VARIANTS (word-by-word, split reveal)
   ════════════════════════════════════════════════════════════ */

export const heroReveal = {
  hidden: { opacity: 0, y: 60, filter: 'blur(12px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, delay: i * 0.08, ease },
  }),
};

/* ════════════════════════════════════════════════════════════
   SKELETON / SHIMMER
   ════════════════════════════════════════════════════════════ */

export const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
  },
};

/* ════════════════════════════════════════════════════════════
   EMPTY / ERROR STATES
   ════════════════════════════════════════════════════════════ */

export const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease } },
};

export const errorShake = {
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};
