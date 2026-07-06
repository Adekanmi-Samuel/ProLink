'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { AnimatedSection, AnimatedStaggerItem } from './AnimatedComponents';
import { fadeUp } from '../lib/motion';

const TESTIMONIALS = [
  {
    name: 'Chidi Okonkwo',
    role: 'Founder, TechLagos',
    project: 'E-commerce Platform Build',
    metric: 'Increased sales by 40%',
    review:
      'ProLink connected me with an exceptional full-stack developer who transformed our e-commerce vision into reality. The escrow system gave us peace of mind, and the quality of work exceeded our expectations.',
    rating: 5,
  },
  {
    name: 'Amina Yusuf',
    role: 'CEO, Yusuf Digital Agency',
    project: 'Brand Identity Redesign',
    metric: 'Client retention up 60%',
    review:
      'The graphic designer we found on ProLink completely reimagined our brand identity. Our clients noticed immediately - engagement soared and our retention metrics hit an all-time high.',
    rating: 5,
  },
  {
    name: 'Femi Adeleke',
    role: 'CTO, PaySwitch',
    project: 'Paystack API Integration',
    metric: 'Payment failures reduced 75%',
    review:
      'We needed a specialist who understood Nigerian payment infrastructure inside out. ProLink delivered. The developer not only integrated Paystack flawlessly but also optimized our entire checkout flow.',
    rating: 5,
  },
  {
    name: 'Kemi Babatunde',
    role: 'Director, SheBuilds Africa',
    project: 'Learning Management Platform',
    metric: '10,000+ students onboarded',
    review:
      'Building an LMS that scales across Nigeria required deep local expertise. ProLink vetted professionals who understood the unique challenges - from offline capability to USSD integration.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      <div className="wrap">
        <AnimatedSection>
          <AnimatedStaggerItem>
            <div className="section-eyebrow">Testimonials</div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <h2 className="h2 mb-3">Trusted by Nigerian businesses</h2>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <p className="max-w-xl mb-14 text-sm sm:text-base" style={{ color: 'var(--fg-secondary)' }}>
              Real stories from real clients who found the talent they needed on ProLink.
            </p>
          </AnimatedStaggerItem>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} {...t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  name,
  role,
  project,
  metric,
  review,
  rating,
  index,
}: {
  name: string;
  role: string;
  project: string;
  metric: string;
  review: string;
  rating: number;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      custom={index}
      className="card group relative p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lg"
    >
      {/* Quote mark fade-in background */}
      <div className="absolute top-4 right-6 text-7xl sm:text-8xl font-serif select-none leading-none" style={{ color: 'var(--fg-tertiary)' }}>
        &ldquo;
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-4 relative z-[1]">
        {Array.from({ length: 5 }).map((_, s) => (
          <motion.div
            key={s}
            className={`w-5 h-5 flex-shrink-0 ${s < rating ? 'text-warning' : ''}`}
            style={{ color: s < rating ? undefined : 'var(--fg-tertiary)' }}
            whileHover={{ scale: 1.3, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Star className="w-full h-full fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Project title + metric badge */}
      <div className="flex items-center gap-2 mb-3 relative z-[1] flex-wrap">
        <span className="text-xs font-semibold text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-0.5">
          {project}
        </span>
        <span className="text-xs font-semibold text-teal-500 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-0.5">
          {metric}
        </span>
      </div>

      {/* Review */}
      <p className="text-sm sm:text-base leading-relaxed mb-5 relative z-[1]" style={{ color: 'var(--fg-secondary)' }}>
        {review}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 relative z-[1]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center font-bold text-sm text-white">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs" style={{ color: 'var(--fg-tertiary)' }}>{role}</div>
        </div>
      </div>
    </motion.div>
  );
}
