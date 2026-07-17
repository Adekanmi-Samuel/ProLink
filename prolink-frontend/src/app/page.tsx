'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Smartphone, Palette, PenLine, Share2, Video,
  TrendingUp, Headphones, Wrench,
  ShieldCheck, Lock, Scale,
  ChevronRight, Star, ArrowUpRight, Sparkles, BadgeCheck
} from 'lucide-react';
import api from '../lib/api';
import {
  AnimatedSection, AnimatedStaggerItem, AnimatedCounter,
  AnimatedCard, AnimatedHoverCard
} from '../components/AnimatedComponents';
import { transitions, fadeUp, staggerContainer, blurReveal, floating } from '../lib/motion';
import TestimonialsSection from '../components/TestimonialsSection';
import CtaSection from '../components/CtaSection';
import FooterSection from '../components/FooterSection';

const HEADLINES = [
  'Hire skilled Nigerian professionals.',
  'Turn your skills into real income.',
  'Built for Nigeria. Backed by escrow.',
];

const CATEGORIES = [
  { icon: Code2, name: 'Web Development', jobs: '340+' },
  { icon: Smartphone, name: 'Mobile Apps', jobs: '185+' },
  { icon: Palette, name: 'Graphic Design', jobs: '410+' },
  { icon: PenLine, name: 'Content Writing', jobs: '290+' },
  { icon: Share2, name: 'Social Media', jobs: '270+' },
  { icon: Video, name: 'Video & Photo', jobs: '155+' },
  { icon: TrendingUp, name: 'Digital Marketing', jobs: '195+' },
  { icon: Headphones, name: 'Virtual Assistant', jobs: '220+' },
  { icon: Wrench, name: 'Home & Repairs', jobs: '95+' },
  { icon: Sparkles, name: 'Event Planning', jobs: '130+' },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'NIN & CAC Verified', desc: 'Every freelancer is verified with Nigerian government ID before they can bid or be hired.', color: 'var(--accent)' },
  { icon: Lock, title: 'Escrow Protection', desc: 'Your money is held safely by Paystack. Released only when you approve the work.', color: 'var(--blue)' },
  { icon: Scale, title: '48h Dispute Resolution', desc: 'Our local team reviews disputes within 48 hours and decides fairly based on evidence.', color: 'var(--warning)' },
  { icon: BadgeCheck, title: '100% Naira. No FX Fees.', desc: 'Post jobs, receive bids, and withdraw earnings - all in Naira, with no hidden dollar conversion fees.', color: 'var(--accent)' },
];

const PROVIDERS_HARDCODED = [
  { initials: 'EO', name: 'Emeka Okafor', title: 'Full-Stack Developer', location: 'Lagos', rating: 4.9, reviews: 38, skills: ['React', 'Node.js', 'Paystack'] },
  { initials: 'AB', name: 'Aisha Bello', title: 'UI/UX Designer', location: 'Abuja', rating: 4.8, reviews: 42, skills: ['Figma', 'Adobe XD', 'Prototyping'] },
  { initials: 'TA', name: 'Tunde Adeyemi', title: 'Digital Marketer', location: 'Lagos', rating: 4.7, reviews: 55, skills: ['SEO', 'Google Ads', 'Content'] },
  { initials: 'NO', name: 'Ngozi Obi', title: 'Content Writer', location: 'Port Harcourt', rating: 4.9, reviews: 61, skills: ['Copywriting', 'SEO', 'Blogging'] },
];

function mapProfileToProvider(profile: any) {
  const name = profile.full_name || profile.name || 'Unknown';
  const initials = name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();
  return {
    initials,
    name,
    title: profile.title || profile.professional_title || profile.headline || '',
    location: profile.location || profile.city || '',
    rating: profile.rating ?? profile.average_rating ?? 0,
    reviews: profile.review_count ?? profile.reviews ?? 0,
    skills: profile.skills || [],
  };
}

const TICKER_ITEMS = [
  'Chukwuemeka just got hired for a React project · Lagos',
  'Fatimah completed a Logo Design job · Abuja',
  '\u20A685,000 released from escrow · Kano',
  'Adebayo earned Top Rated badge · Port Harcourt',
  'Design project posted · Ibadan · 3 bids received',
];

const COLORS = ['#00D68F', '#4A8CFF', '#059669', '#D97706', '#A78BFA', '#F472B6'];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const EASE = [0.22, 1, 0.36, 1];

export default function HomePage() {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState(PROVIDERS_HARDCODED);

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/search/profiles', { params: { limit: 6 } })
      .then((res) => {
        const data = res.data?.data || res.data?.profiles || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setProviders(data.map(mapProfileToProvider));
        }
      })
      .catch(() => {});
  }, []);

  // Rotating headline
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % HEADLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const statVals = {
    providers: stats?.verified_freelancers?.toLocaleString() || '2,400+',
    completed: stats?.jobs_completed?.toLocaleString() || '8,500+',
    paidOut: stats?.total_paid_ngn ? `\u20A6${(stats.total_paid_ngn / 1e6).toFixed(0)}M+` : '\u20A685M+',
  };

  return (
    <div className="page">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[60vh] sm:min-h-[80vh] lg:min-h-[calc(100vh-var(--navbar-h))] flex items-center overflow-hidden pt-[calc(var(--navbar-h)+1.5rem)] lg:pt-[calc(var(--navbar-h)+1rem)] pb-12">
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden light">
          <div className="orb orb-peach" style={{ width: '600px', height: '600px', top: '-10%', right: '-5%' }} />
          <div className="orb orb-cream" style={{ width: '500px', height: '500px', top: '40%', left: '-8%' }} />
          <div className="orb orb-blush" style={{ width: '350px', height: '350px', bottom: '5%', right: '25%' }} />
          <div className="orb orb-sage" style={{ width: '300px', height: '300px', top: '20%', left: '40%' }} />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #1C1815 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="wrap relative z-[1] w-full">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-center hero-grid">
            {/* Left — Text */}
            <motion.div
              className="hero-text-col"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {/* Eyebrow badge */}
              <motion.div
                className="eyebrow inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1 sm:py-1.5"
                style={{ background: 'var(--accent-alpha)', border: '1px solid var(--accent-glow)', color: 'var(--accent)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                Nigeria&apos;s #1 Freelance Network
              </motion.div>

              {/* Headline — cinematic display text */}
              <h1 className="mt-3 sm:mt-5 max-w-[820px] sm:max-w-[720px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`headline-${headlineIdx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.4,  0,  0.2,  1] as any }}
                    className="display-text"
                  >
                    {HEADLINES[headlineIdx]}
                  </motion.span>
                </AnimatePresence>
              </h1>

              {/* Sub */}
              <motion.p
                className="max-w-full sm:max-w-[580px] lg:max-w-[480px] mt-3 sm:mt-4 leading-relaxed"
                style={{ fontSize: 'var(--text-lg)', color: 'var(--fg-secondary)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
              >
                Post a job in 2 minutes. Get bids from verified Nigerian professionals. Pay only when you&apos;re satisfied.
              </motion.p>

              {/* CTAs */}
              <motion.div
                className="flex gap-3 mt-8 flex-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
              >
                <Link
                  href="/jobs/new"
                  className="btn-primary group inline-flex items-center gap-2"
                  style={{ textDecoration: 'none' }}
                >
                  Post a Job
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/jobs"
                  className="btn-ghost-warm inline-flex items-center gap-2"
                  style={{ textDecoration: 'none' }}
                >
                  Find Work
                </Link>
              </motion.div>

              {/* Stats bar */}
              <motion.div
                className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-0 mt-6 sm:mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {[
                  { val: statVals.providers, label: 'Verified Providers' },
                  { val: statVals.completed, label: 'Jobs Completed' },
                  { val: statVals.paidOut, label: 'Paid Out' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1, ease: EASE }}
                    className={`px-3 sm:px-7 ${i < 2 ? 'sm:border-r' : ''} text-center sm:text-left`}
                    style={{ borderRightColor: i < 2 ? 'var(--border)' : undefined }}
                  >
                    <span
                      className="block font-bold leading-none"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 'var(--text-xl)',
                        color: 'var(--accent)',
                      }}
                    >
                      <AnimatedCounter value={s.val} />
                    </span>
                    <span
                      className="block mt-1 uppercase tracking-wider"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)' }}
                    >
                      {s.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Floating Hero Card */}
            <motion.div
              className="hidden lg:block hero-ticket-col relative w-[370px] flex-shrink-0"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
            >
              <motion.div
                className="absolute top-5 left-[18px] w-full h-[calc(100%-18px)] rounded-3xl border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', opacity: 0.35, transform: 'rotate(5deg) scale(0.94)' }}
              />
              <motion.div
                className="relative rounded-3xl overflow-hidden card-float"
                initial={{ opacity: 0, y: 30, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.34,  1.56,  0.64,  1] as any }}
              >
                {/* Gradient border */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    padding: '1.5px',
                    background: 'linear-gradient(135deg, var(--accent), var(--emerald), var(--accent-light), var(--accent))',
                    backgroundSize: '300% 300%',
                    animation: 'borderSpin 4s linear infinite',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                <div className="relative z-[1] p-5" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                      Open
                    </span>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--surface-warm)', border: '1px solid var(--border)', color: 'var(--fg-tertiary)' }}>
                      Web Development
                    </span>
                  </div>
                  <h3
                    className="font-bold leading-snug mb-3"
                    style={{ fontSize: 'var(--text-md)' }}
                  >
                    Build e-commerce site with Paystack integration
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[11px]"
                      style={{ background: '#05966920', color: '#059669' }}
                    >
                      AC
                    </div>
                    <div>
                      <div className="font-semibold" style={{ fontSize: 'var(--text-sm)' }}>Ade C.</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Lagos &middot; Just now</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold mb-3" style={{ fontSize: 'var(--text-xl)', color: 'var(--accent)' }}>
                    <span>₦</span>150,000 – 250,000
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }} />
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">
                      {['TO', 'BK', 'AM'].map((init, idx) => (
                        <motion.div
                          key={idx}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[9px]"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface-warm)', color: 'var(--fg-tertiary)', marginLeft: idx > 0 ? '-6px' : '0' }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + idx * 0.1, duration: 0.3 }}
                        >
                          {init}
                        </motion.div>
                      ))}
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>7 providers are bidding</span>
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TICKER ═══════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        className="border-y"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-warm)' }}
      >
        <div className="ticker-wrap py-3">
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center text-sm px-8" style={{ color: 'var(--fg-secondary)' }}>
                <Sparkles className="w-3 h-3 mr-2" style={{ color: 'var(--accent)' }} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════ CATEGORIES ═══════════════════ */}
      <section className="section section-warm">
        <div className="wrap">
          <AnimatedSection>
            <AnimatedStaggerItem>
              <div className="overline text-center">What you can do here</div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <h2 className="section-title text-center mb-10">Explore opportunities</h2>
            </AnimatedStaggerItem>
          </AnimatedSection>

          <AnimatedSection delay={0.2} stagger={0.05}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {CATEGORIES.map((cat, i) => (
                <AnimatedStaggerItem key={i}>
                  <Link
                    href={`/jobs?category=${encodeURIComponent(cat.name)}`}
                    className="card-base group flex flex-col items-center text-center p-6 cursor-pointer transition-all duration-200"
                    style={{ borderColor: 'var(--border)', display: 'flex' }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: 'var(--accent-alpha)' }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <cat.icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    </motion.div>
                    <div className="font-semibold mb-1" style={{ fontSize: 'var(--text-md)' }}>{cat.name}</div>
                    <div className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)' }}>{cat.jobs} jobs</div>
                  </Link>
                </AnimatedStaggerItem>
              ))}
            </div>
          </AnimatedSection>

          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <Link
              href="/jobs"
              className="browse-all-link inline-flex items-center gap-1.5 group"
            >
              Browse all 240+ jobs
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="section" style={{ background: 'var(--surface-warm)', paddingTop: '6rem', paddingBottom: '7rem', overflowX: 'hidden' }}>
        <div className="wrap">
          <AnimatedSection>
            <AnimatedStaggerItem>
              <div className="overline text-center">How it works</div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <h2 className="section-title text-center mb-16">Two ways to use ProLink</h2>
            </AnimatedStaggerItem>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-10 md:gap-24 relative items-start max-w-4xl mx-auto">
            {/* Divider between tracks */}
            <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex-col items-center justify-center">
              <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, transparent, var(--border))' }} />
              <span
                className="text-xs font-bold uppercase tracking-widest my-2 px-3 py-1 rounded-full"
                style={{ color: 'var(--fg-tertiary)', background: 'var(--surface)', border: '1px solid var(--border)' }}
              >OR</span>
              <div className="w-px flex-1" style={{ background: 'linear-gradient(to bottom, var(--border), transparent)' }} />
            </div>

            {/* Client track */}
            <AnimatedSection delay={0.1}>
              <AnimatedStaggerItem>
                <div className="mb-8">
                  <span className="badge badge-info">For Clients</span>
                  <h3 className="h3 mt-2">I need to hire</h3>
                </div>
              </AnimatedStaggerItem>
              <div className="relative pl-10">
                <div className="absolute left-[11px] top-1 bottom-2 w-px bg-gradient-to-b from-blue-500/40 to-transparent" />
                {[
                  { num: 1, title: 'Post a job', desc: 'Describe your project, set a budget, and publish' },
                  { num: 2, title: 'Review proposals', desc: 'Browse bids, check profiles and ratings' },
                  { num: 3, title: 'Hire and pay safely', desc: 'Fund escrow, release when satisfied' },
                ].map((s, i) => (
                  <AnimatedStaggerItem key={i}>
                    <motion.div
                      className="relative mb-10 last:mb-0"
                      whileHover={{ x: 4 }}
                    >
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-mono text-xs font-bold z-[1]">
                        {s.num}
                      </div>
                      <div className="font-bold text-sm mb-0.5 relative z-[1]">{s.title}</div>
                      <div className="text-sm relative z-[1]" style={{ fontSize: 'var(--text-sm)', maxWidth: '38ch', lineHeight: 'var(--leading-loose)', color: 'var(--fg-secondary)' }}>{s.desc}</div>
                    </motion.div>
                  </AnimatedStaggerItem>
                ))}
              </div>
            </AnimatedSection>

            {/* Provider track */}
            <AnimatedSection delay={0.3}>
              <AnimatedStaggerItem>
                <div className="mb-8">
                  <span className="badge badge-warning">For Providers</span>
                  <h3 className="h3 mt-2">I want to work</h3>
                </div>
              </AnimatedStaggerItem>
              <div className="relative pl-10">
                <div className="absolute left-[11px] top-1 bottom-2 w-px bg-gradient-to-b from-amber-500/40 to-transparent" />
                {[
                  { num: 1, title: 'Build your profile', desc: 'Add skills, portfolio, and your rate' },
                  { num: 2, title: 'Find matching jobs', desc: 'Browse open jobs filtered to your skills' },
                  { num: 3, title: 'Bid and get paid', desc: 'Submit proposals and earn in Naira' },
                ].map((s, i) => (
                  <AnimatedStaggerItem key={i}>
                    <motion.div
                      className="relative mb-10 last:mb-0"
                      whileHover={{ x: 4 }}
                    >
                      <div className="absolute -left-10 w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-mono text-xs font-bold z-[1]">
                        {s.num}
                      </div>
                      <div className="font-bold text-sm mb-0.5 relative z-[1]">{s.title}</div>
                      <div className="text-sm relative z-[1]" style={{ fontSize: 'var(--text-sm)', maxWidth: '38ch', lineHeight: 'var(--leading-loose)', color: 'var(--fg-secondary)' }}>{s.desc}</div>
                    </motion.div>
                  </AnimatedStaggerItem>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUST ═══════════════════ */}
      <section className="section section-sage">
        <div className="wrap">
          <AnimatedSection>
            <AnimatedStaggerItem>
              <div className="overline text-center">Why ProLink</div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <h2 className="section-title text-center mb-10">Built for trust</h2>
            </AnimatedStaggerItem>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-5">
            {TRUST_POINTS.map((t, i) => (
              <AnimatedCard key={i} index={i}>
                <AnimatedHoverCard>
                  <div className="card-featured h-full p-6 transition-all duration-300">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${t.color}18` }}
                    >
                      <t.icon className="w-6 h-6" style={{ color: t.color }} />
                    </div>
                    <h3 className="font-bold mb-1" style={{ fontSize: 'var(--text-lg)' }}>{t.title}</h3>
                    <p className="leading-relaxed" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>{t.desc}</p>
                  </div>
                </AnimatedHoverCard>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED PROVIDERS ═══════════════════ */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="wrap">
          <AnimatedSection>
            <AnimatedStaggerItem>
              <div className="overline">Top talent</div>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <h2 className="section-title">Top Rated Providers This Week</h2>
            </AnimatedStaggerItem>
            <AnimatedStaggerItem>
              <p className="mt-1 mb-8" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>Verified, reviewed, and ready to work</p>
            </AnimatedStaggerItem>
          </AnimatedSection>

          <AnimatedSection delay={0.15} stagger={0.1}>
            <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
              {providers.map((p, i) => (
                <AnimatedStaggerItem key={i}>
                  <AnimatedHoverCard>
                    <div className="min-w-[250px] card-base p-5 flex-shrink-0">
                      <motion.div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-base mb-3"
                        style={{
                          background: `${avatarColor(p.name)}20`,
                          color: avatarColor(p.name),
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {p.initials}
                      </motion.div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold" style={{ fontSize: 'var(--text-sm)' }}>{p.name}</span>
                        <span className="badge badge-gold">Top Rated</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>{p.title}</div>
                      <div className="flex items-center gap-1 mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                        {p.location}
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block ml-0.5" />
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500 mb-2" style={{ fontSize: 'var(--text-sm)' }}>
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="font-semibold">{p.rating}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>({p.reviews} reviews)</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {p.skills.map(s => (
                          <span key={s} className="badge badge-neutral text-[10px] px-2 py-0.5">
                            {s}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/profiles/${p.name.toLowerCase().replace(/\s/g, '-')}`}
                        className="btn btn-outline w-full text-sm"
                      >
                        View Profile
                      </Link>
                    </div>
                  </AnimatedHoverCard>
                </AnimatedStaggerItem>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <TestimonialsSection />

      {/* ═══════════════════ CTA ═══════════════════ */}
      <CtaSection />

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <FooterSection />

      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ProLink Nigeria",
            url: "https://prolink.vercel.app",
            logo: "https://prolink.vercel.app/logo.png",
            description: "Nigeria's professional freelance network. Connect with verified professionals, pay in Naira, and get work done securely with escrow protection.",
            sameAs: [
              "https://twitter.com/prolinkng",
              "https://linkedin.com/company/prolink-ng",
              "https://instagram.com/prolinkng"
            ],
            address: {
              "@type": "PostalAddress",
              addressCountry: "NG",
              addressRegion: "Lagos"
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: ["English"]
            }
          })
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ProLink Nigeria",
            url: "https://prolink.vercel.app",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://prolink.vercel.app/jobs?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </div>
  );
}
