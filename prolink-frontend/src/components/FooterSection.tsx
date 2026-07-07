'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { AnimatedSection, AnimatedStaggerItem } from './AnimatedComponents';

const FOOTER_LINKS = {
  Product: [
    { label: 'Find Work', href: '/jobs' },
    { label: 'Post a Job', href: '/jobs/new' },
    { label: 'Browse Talent', href: '/talent' },
    { label: 'How it Works', href: '/#how-it-works' },
  ],
  Company: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Dispute Policy', href: '/dispute-policy' },
  ],
};

const SOCIALS = [
  { path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', href: 'https://twitter.com', label: 'Twitter' },
  { path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', href: 'https://linkedin.com', label: 'LinkedIn' },
  { path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z', href: 'https://instagram.com', label: 'Instagram' },
];

export default function FooterSection() {
  return (
    <footer className="relative pt-20 pb-8">
      {/* Subtle gradient border on top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="wrap">
        <AnimatedSection>
          {/*
            Grid: 12 columns on lg, 2 on sm, 1 on mobile.
            Each AnimatedStaggerItem is a direct grid child, so
            lg:col-span-* goes on the stagger item itself.
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
            {/* Brand + Newsletter — 5 cols */}
            <AnimatedStaggerItem className="lg:col-span-5">
              <div className="max-w-md">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-xl mb-3">
                  <span className="text-teal-500">Pro</span><span>Link</span>
                </div>
                <p className="text-sm leading-relaxed mb-6 max-w-sm" style={{ color: 'var(--fg-secondary)' }}>
                  Nigeria&apos;s professional freelance network. Connecting verified talent with trusted clients through secure escrow payments.
                </p>

                {/* Newsletter */}
                <div className="flex items-center gap-2 w-full sm:max-w-sm">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--fg-tertiary)' }} />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="field w-full"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  <motion.button
                    className="btn btn-accent btn-icon w-12 h-12 flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </AnimatedStaggerItem>

            {/* Link Columns — each takes 2 cols */}
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <AnimatedStaggerItem key={title} className="sm:col-span-1 lg:col-span-2">
                <div>
                  <div className="eyebrow mb-4">{title}</div>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm transition-colors duration-200"
                          style={{ color: 'var(--fg-secondary)' }}
                          onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseOut={e => e.currentTarget.style.color = 'var(--fg-secondary)'}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedStaggerItem>
            ))}

            {/* Contact + Social — 3 cols */}
            <AnimatedStaggerItem className="sm:col-span-2 lg:col-span-3">
              <div>
                <div className="eyebrow mb-4">Contact</div>
                <p className="text-sm mb-2" style={{ color: 'var(--fg-secondary)' }}>hello@prolink.ng</p>
                <p className="text-sm mb-5" style={{ color: 'var(--fg-secondary)' }}>
                  <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                    WhatsApp Support
                  </a>
                </p>
                <div className="flex gap-3">
                  {SOCIALS.map((s) => (
                    <motion.a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-tertiary)' }}
                      whileHover={{ scale: 1.1, y: -2, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={s.path} /></svg>
                    </motion.a>
                  ))}
                </div>
              </div>
            </AnimatedStaggerItem>
          </div>
        </AnimatedSection>

        {/* Bottom bar */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--fg-tertiary)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span>&copy; {new Date().getFullYear()} ProLink Nigeria. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-fg transition-colors" style={{ color: 'inherit' }}>Privacy</Link>
            <Link href="/terms" className="hover:text-fg transition-colors" style={{ color: 'inherit' }}>Terms</Link>
            <Link href="/dispute-policy" className="hover:text-fg transition-colors" style={{ color: 'inherit' }}>Disputes</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
