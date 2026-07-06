'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pageTransition } from '../lib/motion';

gsap.registerPlugin(ScrollTrigger);

export default function LandingAnimator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    // Animate page entrance with GSAP
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
    );

    // Staggered hero content
    const heroContent = ref.current?.querySelector('.hero-text-col');
    if (heroContent) {
      gsap.fromTo(
        heroContent.querySelectorAll('.eyebrow, h1, p, .flex.gap-3'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.1 }
      );
    }

    // Animate cards on scroll - use actual card classes
    const cards = ref.current?.querySelectorAll('.card-base, .card-featured, .card-float');
    if (cards?.length) {
      gsap.fromTo(
        Array.from(cards),
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.3,
          scrollTrigger: {
            trigger: cards[0],
            start: 'top 85%',
          },
        }
      );
    }

    const timer = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        ref={ref}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
