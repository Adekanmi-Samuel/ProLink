'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

/**
 * usePageEnter - Fade-up entrance animation for pages/sections
 */
export function usePageEnter(ref: React.RefObject<HTMLElement | null>, deps: any[] = []) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useStaggerChildren - Stagger-animate children of a container element
 * @param ref - Container ref
 * @param childSelector - CSS selector for children (e.g. '.stat-card')
 * @param deps - Dependencies to re-trigger animation
 */
export function useStaggerChildren(
  ref: React.RefObject<HTMLElement | null>,
  childSelector: string,
  deps: any[] = []
) {
  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.querySelectorAll(childSelector);
    if (!children.length) return;
    gsap.fromTo(
      children,
      { opacity: 0, y: 20, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.08,
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useCountUp - Animate a number from 0 to target value
 * @param ref - Ref to the element containing the number
 * @param value - Target value
 * @param deps - Dependencies to re-trigger
 */
export function useCountUp(
  ref: React.RefObject<HTMLElement | null>,
  value: number,
  deps: any[] = []
) {
  useEffect(() => {
    if (!ref.current || value === 0) return;
    const el = ref.current;
    const start = parseInt(el.textContent || '0') || 0;
    const duration = Math.min(1.5, Math.max(0.5, value / 50000)); // Dynamic duration

    gsap.fromTo(
      el,
      { textContent: start },
      {
        textContent: value,
        duration,
        ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate: () => {
          // Format with commas
          const num = parseInt(el.textContent || '0');
          el.textContent = num.toLocaleString();
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useRevealOnScroll - Animate element into view when scrolled to
 * @param ref - Ref to the element to reveal
 */
export function useRevealOnScroll(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    // Set initial state
    gsap.set(el, { opacity: 0, y: 30 });
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * createRipple - Creates a ripple effect on a button click
 */
export function createRipple(e: React.MouseEvent<HTMLElement>) {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const radius = diameter / 2;

  const rect = btn.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.style.position = 'absolute';
  circle.style.borderRadius = '50%';
  circle.style.background = 'rgba(255, 255, 255, 0.3)';
  circle.style.transform = 'scale(0)';
  circle.style.animation = 'ripple-effect 0.6s ease-out';
  circle.style.pointerEvents = 'none';

  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

/**
 * createGlow - brief glow effect on hover
 */
export function createGlow(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  el.style.setProperty('--glow-x', `${x}px`);
  el.style.setProperty('--glow-y', `${y}px`);
}
