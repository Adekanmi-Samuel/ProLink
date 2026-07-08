'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatedSection, AnimatedStaggerItem } from './AnimatedComponents';

export default function CtaSection() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      {/* Warm ambient background */}
      <div className="absolute inset-0 pointer-events-none light">
        <div className="orb orb-peach" style={{ width: '500px', height: '500px', top: '10%', left: '-10%' }} />
        <div className="orb orb-blush" style={{ width: '400px', height: '400px', bottom: '10%', right: '-5%' }} />
        <div className="orb orb-cream" style={{ width: '300px', height: '300px', top: '40%', left: '50%' }} />
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-12 left-[15%] w-4 h-4 rounded-full bg-blue-400/30 blur-sm pointer-events-none"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-16 right-[20%] w-6 h-6 rounded-full bg-teal-400/25 blur-sm pointer-events-none"
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-[30%] right-[10%] w-3 h-3 rounded-full bg-indigo-400/20 blur-sm pointer-events-none"
        animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="wrap relative z-[1]">
        <AnimatedSection>
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedStaggerItem>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6"
                style={{ border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}
                whileHover={{ scale: 1.02 }}
              >
                <Sparkles className="w-4 h-4 text-blue-500" />
                Join thousands of verified Nigerian professionals
              </motion.div>
            </AnimatedStaggerItem>

            <AnimatedStaggerItem>
              <h2 className="h-display mb-4">
                Ready to build{' '}
                <span style={{ color: 'var(--accent)' }}>
                  something great
                </span>
                ?
              </h2>
            </AnimatedStaggerItem>

            <AnimatedStaggerItem>
              <p className="text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
                Post your first job in under 2 minutes. Hire verified Nigerian talent with escrow protection - zero risk, all reward.
              </p>
            </AnimatedStaggerItem>

            <AnimatedStaggerItem>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/jobs/new"
                  className="btn-primary inline-flex items-center gap-2"
                  style={{ padding: '16px 32px', fontSize: '1rem', textDecoration: 'none' }}
                >
                  <span>Post a Job - It&apos;s Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/signup"
                  className="btn-ghost-warm inline-flex items-center gap-2"
                  style={{ padding: '16px 32px', fontSize: '1rem', textDecoration: 'none' }}
                >
                  Create Account
                </Link>
              </div>
            </AnimatedStaggerItem>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
