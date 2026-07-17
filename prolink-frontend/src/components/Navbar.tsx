'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useTheme } from './ThemeProvider';
import { navbarVariants, dropdownVariants } from '../lib/motion';
import { useSocket } from '../lib/SocketContext';

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
  const { socket } = useSocket();

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/profiles/me');
      setUser(res.data);
      try {
        const n = await api.get('/notifications/unread-count');
        setNotifCount(n.data?.count || 0);
      } catch { setNotifCount(0); }
    } catch (err: any) {
      // Only clear user on definitive 401 (not network errors or 500s)
      if (err?.response?.status === 401) {
        setUser(null);
      }
      // On network/500 errors, keep existing user state (don't flicker)
      setNotifCount(0);
    }
  }, []);

  useEffect(() => { setMounted(true); fetchUser(); }, [fetchUser, pathname]);

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
    // Polling fallback/supplement for instant updates
    if (!user) return;
    const interval = setInterval(() => {
      api.get('/notifications/unread-count').then((res) => {
        setNotifCount(res.data?.count || 0);
      }).catch(() => {});
      if (notifDropdown) {
        fetchNotifications();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, notifDropdown, fetchNotifications]);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotif = (notif) => {
      setNotifCount((c) => c + 1);
      setNotifications((prev) => [notif, ...prev].slice(0, 5));
    };
    socket.on('notification', handleNewNotif);
    socket.on('global_notification', handleNewNotif);
    return () => {
      socket.off('notification', handleNewNotif);
      socket.off('global_notification', handleNewNotif);
    };
  }, [socket]);

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

  const handleSignOut = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setAvatarDropdown(false);
    setMobileMenu(false);
    router.push('/');
  };

  const isProvider = user?.user_type === 'provider';
  const isClient = user?.user_type === 'client';
  const isAdmin = user?.user_type === 'admin';
  const initials = user?.full_name
    ? user.full_name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const loggedOutNav = [
    { href: '/services', label: 'Services' },
    { href: '/jobs', label: 'Find Work' },
    { href: '/jobs/new', label: 'Post a Job' },
    { href: '/#how-it-works', label: 'How it Works' },
  ];
  const clientNav = [
    { href: '/services', label: 'Services' },
    { href: '/jobs/new', label: 'Post a Job' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/messages', label: 'Messages' },
  ];
  const providerNav = [
    { href: '/services', label: 'Services' },
    { href: '/jobs', label: 'Find Work' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/messages', label: 'Messages' },
  ];
  const adminNav = [
    { href: '/admin', label: 'Admin Panel' },
    { href: '/admin/verifications', label: 'Verifications' },
    { href: '/admin/disputes', label: 'Disputes' },
  ];

  const currentNavLinks = !user ? loggedOutNav : isAdmin ? adminNav : isProvider ? providerNav : clientNav;

  const dropdownLinks = [
    { href: '/profile', label: 'Edit Profile' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

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
          {/* Left: hamburger + logo — always visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!pathname?.startsWith('/dashboard') && (
              <motion.button
                onClick={() => setMobileMenu((v) => !v)}
                className="navbar-hamburger"
                aria-label="Toggle menu"
                whileTap={{ scale: 0.92 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  {mobileMenu ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                    </>
                  )}
                </svg>
              </motion.button>
            )}
            <Link href={user ? '/dashboard' : '/'} className="navbar-logo">
              <span className="navbar-logo-accent">Pro</span>
              <span className="navbar-logo-fg">Link</span>
            </Link>
          </div>

          {/* Center: desktop nav only (hidden on mobile via CSS) */}
          <nav className="navbar-nav hide-mobile">
            {currentNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`navbar-link${isActive(link.href) ? ' navbar-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: notifications, avatar, theme toggle */}
          <div className="navbar-right">
            {user ? (
              <>
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => { setNotifDropdown((v) => !v); fetchNotifications(); }}
                    className="btn btn-ghost btn-icon"
                    aria-label="Notifications"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {notifCount > 0 && (
                      <span className="navbar-notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                    )}
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
                  <motion.div
                    onClick={() => setAvatarDropdown((v) => !v)}
                    className="navbar-avatar"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {initials}
                  </motion.div>
                  <AnimatePresence>
                    {avatarDropdown && (
                      <motion.div className="avatar-dropdown-panel" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                        {user.full_name && (
                          <div className="avatar-dropdown-header">
                            <div className="avatar-dropdown-header-avatar">{initials}</div>
                            <div>
                              <div className="avatar-dropdown-header-name">{user.full_name}</div>
                              <div className="avatar-dropdown-header-email">{user.email}</div>
                            </div>
                          </div>
                        )}
                        <div className="avatar-dropdown-divider" />
                        {dropdownLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="avatar-dropdown-item"
                            onClick={() => setAvatarDropdown(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                        <div className="avatar-dropdown-divider avatar-dropdown-divider-sm" />
                        <button onClick={handleSignOut} className="avatar-dropdown-item avatar-dropdown-item-danger">
                          Log out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" style={{ color: 'var(--fg)', fontWeight: 600, fontSize: '0.88rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}>
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-ghost-warm btn-sm">
                  Sign up free
                </Link>
              </>
            )}
            <button onClick={toggleTheme} className="btn btn-ghost btn-icon" aria-label="Toggle theme">
              <motion.div
                key={theme}
                initial={{ rotate: -20, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
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
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer — accessible from any page */}
      <AnimatePresence>
        {mobileMenu && (
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
                  <span className="navbar-logo-accent">Pro</span>
                  <span className="navbar-logo-fg">Link</span>
                </span>
                <button onClick={() => setMobileMenu(false)} className="btn btn-ghost btn-icon" aria-label="Close menu">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Main nav links */}
              <div style={{ marginBottom: user ? '0.5rem' : '0' }}>
                {currentNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mobile-drawer-link"
                    onClick={() => setMobileMenu(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Account links when logged in */}
              {user && (
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.3rem 0', paddingTop: '0.5rem' }}>
                  {dropdownLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="mobile-drawer-link"
                      onClick={() => setMobileMenu(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button onClick={handleSignOut} className="mobile-drawer-link" style={{ color: 'var(--danger)' }}>
                    Log out
                  </button>
                </div>
              )}

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
