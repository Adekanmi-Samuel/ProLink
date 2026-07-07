'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useTheme } from './ThemeProvider';
import { navbarVariants, dropdownVariants, transitions } from '../lib/motion';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [avatarDropdown, setAvatarDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  /* ── Auth state ── */
  const fetchUser = useCallback(async () => {
    let token = null;
    try { token = localStorage.getItem('prolink_token'); } catch { /* noop */ }
    if (!token) { setUser(null); setNotifCount(0); return; }
    try {
      const res = await api.get('/profiles/me');
      setUser(res.data);
      try {
        const n = await api.get('/notifications/unread-count');
        setNotifCount(n.data?.count || 0);
      } catch { setNotifCount(0); }
    } catch {
      try { localStorage.removeItem('prolink_token'); } catch { /* noop */ }
      setUser(null);
    }
  }, []);

  useEffect(() => { setMounted(true); fetchUser(); }, [fetchUser, pathname]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=5');
      setNotifications(res.data?.notifications || res.data || []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    setAvatarDropdown(false);
    setNotifDropdown(false);
    setMobileMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!avatarDropdown && !notifDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAvatarDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [avatarDropdown, notifDropdown]);

  const handleSignOut = () => {
    localStorage.removeItem('prolink_token');
    setUser(null);
    setAvatarDropdown(false);
    setMobileMenu(false);
    router.push('/');
  };

  const isProvider = user?.user_type === 'provider';
  const isClient = user?.user_type === 'client';
  const isAdmin = user?.user_type === 'admin';
  const initials = user?.full_name ? user.full_name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase() : '?';

  const loggedOutNav = [
    { href: '/jobs', label: 'Find Work' },
    { href: '/jobs/new', label: 'Post a Job' },
    { href: '/#how-it-works', label: 'How it Works' },
  ];
  const clientNav = [
    { href: '/jobs/new', label: 'Post a Job' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Messages' },
  ];
  const providerNav = [
    { href: '/jobs', label: 'Find Work' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Messages' },
  ];
  const adminNav = [
    { href: '/admin', label: 'Admin Panel' },
    { href: '/admin/verifications', label: 'Verifications' },
    { href: '/admin/disputes', label: 'Disputes' },
  ];

  const currentNavLinks = !user ? loggedOutNav : isAdmin ? adminNav : isProvider ? providerNav : clientNav;

  const dropdownLinks = [
    { href: '/profile/edit', label: 'Edit Profile' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  // Check if we're on a dashboard page (which has its own sidebar)
  const isDashboard = pathname.startsWith('/dashboard');

  if (!mounted) return null;

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <motion.header
        variants={navbarVariants}
        initial="hidden"
        animate="visible"
        className={scrolled ? 'navbar-main scrolled' : 'navbar-main'}
      >
        <div className="navbar-inner">
            <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
              <span className="navbar-logo-accent">Pro</span><span className="navbar-logo-fg">Link</span>
            </Link>
            <nav className="navbar-nav hide-mobile">
              {currentNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`navbar-link${isActive(link.href) ? ' navbar-link-active' : ''} ${isAdmin ? 'navbar-link-admin' : isProvider ? 'navbar-link-provider' : 'navbar-link-client'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="navbar-right">
              <button onClick={toggleTheme} className="btn btn-ghost btn-icon mr-2" aria-label="Toggle theme">
                <motion.div key={theme} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                  {theme === 'dark' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </motion.div>
              </button>
              {user ? (
                <>
                  <div ref={notifRef} style={{ position: 'relative' }}>
                    <button onClick={() => { setNotifDropdown(v => !v); fetchNotifications(); }} className="btn btn-ghost btn-icon" aria-label="Notifications">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                      {notifCount > 0 && <span className="navbar-notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
                    </button>
                    <AnimatePresence>
                      {notifDropdown && (
                        <motion.div className="notif-panel" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                          <div className="notif-panel-header">Notifications</div>
                          {notifications.length > 0 ? (
                            notifications.map((n, i) => (
                              <div key={i} className="notif-item">
                                <div className="notif-item-title">{n.title}</div>
                                <div className="notif-item-message">{n.message}</div>
                              </div>
                            ))
                          ) : (
                            <div className="notif-empty">No notifications yet</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <motion.div onClick={() => setAvatarDropdown(v => !v)} className={`navbar-avatar ${isAdmin ? 'navbar-avatar-admin' : isProvider ? 'navbar-avatar-provider' : 'navbar-avatar-client'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {initials}
                    </motion.div>
                    <AnimatePresence>
                      {avatarDropdown && (
                        <motion.div className="avatar-dropdown-panel" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                          {user.full_name && (
                            <div className="avatar-dropdown-header">
                              <div className="avatar-dropdown-header-avatar">{initials}</div>
                              <div>
                                <div className="avatar-dropdown-header-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {user.full_name}
                                  {isAdmin && <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>ADMIN</span>}
                                  {isProvider && <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>PROVIDER</span>}
                                  {isClient && <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>CLIENT</span>}
                                </div>
                                <div className="avatar-dropdown-header-email">{user.email}</div>
                              </div>
                            </div>
                          )}
                          <div className="avatar-dropdown-divider" />
                          {dropdownLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="avatar-dropdown-item" onClick={() => setAvatarDropdown(false)}>{link.label}</Link>
                          ))}
                          <div className="avatar-dropdown-divider avatar-dropdown-divider-sm" />
                          <button onClick={handleSignOut} className="avatar-dropdown-item avatar-dropdown-item-danger">Log out</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="font-semibold text-sm px-4 py-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--fg)' }}>Log in</Link>
                  <Link href="/signup" className="btn btn-ghost-warm btn-sm">Sign up free</Link>
                </>
              )}
              <motion.button onClick={() => setMobileMenu(v => !v)} className="navbar-hamburger" aria-label="Toggle menu" whileTap={{ scale: 0.92 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  {mobileMenu
                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                    : <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>
                  }
                </svg>
              </motion.button>
            </div>
          </div>
      </motion.header>

      {/* Mobile drawer (shared between both themes) - hide on dashboard pages which have their own sidebar */}
      <AnimatePresence>
        {!isDashboard && mobileMenu && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenu(false)}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
            >
              <div className="mobile-drawer-header">
                <span className="navbar-logo">
                  <span className="navbar-logo-accent">Pro</span><span className="navbar-logo-fg">Link</span>
                </span>
                <button
                  onClick={() => setMobileMenu(false)}
                  className="btn btn-ghost btn-icon"
                  aria-label="Close menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {currentNavLinks.map((link, i) => (
                <Link key={link.href} href={link.href} className="mobile-drawer-link" onClick={() => setMobileMenu(false)}>
                  {link.label}
                </Link>
              ))}


              {!user && (
                <div className="mobile-drawer-auth">
                  <Link href="/login" className="btn btn-outline mobile-drawer-auth-btn" onClick={() => setMobileMenu(false)}>
                    Log in
                  </Link>
                  <Link href="/signup" className="btn btn-ghost-warm mobile-drawer-auth-btn" onClick={() => setMobileMenu(false)}>
                    Sign up free
                  </Link>
                </div>
              )}

              <div className="mobile-drawer-footer">
                <button onClick={() => { toggleTheme(); }} className="mobile-drawer-theme-btn">
                  {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
