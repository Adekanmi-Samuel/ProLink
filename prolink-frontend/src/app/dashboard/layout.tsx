'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../lib/api';

const FAUCET_EASING = [0.22, 1, 0.36, 1];
const DROP_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.4, delay: 0.08 * i, ease: FAUCET_EASING },
  }),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/profiles/me');
        setUser(res.data);
      } catch { /* noop */ }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const res = await api.get('/chats');
          let total = 0;
          if (res.data?.data) {
            res.data.data.forEach((t: any) => total += (t.unread_count || 0));
          }
          setUnreadCount(total);
        } catch { /* noop */ }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [user, pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const userType = user?.user_type;
  const isProvider = userType === 'provider';
  const userLoaded = !!user;

  const providerLinks = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/jobs', label: 'Find Work', icon: '🔍' },
    { href: '/dashboard/saved-jobs', label: 'Saved Jobs', icon: '🔖' },
    { href: '/dashboard/my-bids', label: 'My Proposals', icon: '📝' },
    { href: '/dashboard/contracts', label: 'Active Contracts', icon: '📋' },
    { href: '/dashboard/portfolio', label: 'Portfolio', icon: '🖼️' },
    { href: '/dashboard/messages', label: 'Messages', icon: '💬' },
    { href: '/dashboard/wallet', label: 'Wallet & Earnings', icon: '💰' },
    { href: '/dashboard/verification', label: 'Verification', icon: '🛡️' },
    { href: '/profile/edit', label: 'Settings', icon: '⚙️' },
  ];

  const clientLinks = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/jobs/new', label: 'Post a Job', icon: '➕' },
    { href: '/dashboard/my-jobs', label: 'My Jobs', icon: '📋' },
    { href: '/talent', label: 'Find Talent', icon: '🔎' },
    { href: '/dashboard/messages', label: 'Messages', icon: '💬' },
    { href: '/dashboard/wallet', label: 'Wallet & Billing', icon: '💳' },
    { href: '/profile/edit', label: 'Settings', icon: '⚙️' },
  ];

  // Admin users get a link
  const links = userLoaded ? [
    ...(isProvider ? providerLinks : clientLinks),
  ] : [];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="dash-layout">
      <style>{`
        .dash-layout {
          display: flex;
          min-height: calc(100vh - var(--navbar-h));
          background: var(--bg);
        }
        .dash-sidebar {
          width: var(--sidebar-w);
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          position: sticky;
          top: var(--navbar-h);
          height: calc(100vh - var(--navbar-h));
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
        }
        .dash-sidebar__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0 1.25rem 1.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .dash-sidebar__avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--accent-alpha); color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 1rem; flex-shrink: 0;
          font-family: var(--font-mono), monospace;
        }
        .dash-sidebar__user-info { min-width: 0; }
        .dash-sidebar__name {
          font-size: 0.9rem; font-weight: 700; color: var(--fg);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dash-sidebar__role {
          font-size: 0.72rem; color: var(--fg-tertiary); margin-top: 2px;
        }
        .dash-sidebar__role-badge {
          display: inline-block; padding: 1px 8px; border-radius: 99px;
          font-family: var(--font-mono), monospace; font-size: 0.6rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .dash-sidebar__nav {
          display: flex; flex-direction: column; gap: 2px; padding: 0 0.75rem;
        }
        .dash-sidebar__link {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.75rem; font-size: 0.85rem; font-weight: 500;
          color: var(--fg-secondary); border-radius: var(--radius);
          text-decoration: none;
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }
        .dash-sidebar__link:hover {
          color: var(--fg); background: var(--accent-alpha);
        }
        .dash-sidebar__link--active {
          color: var(--accent) !important;
          background: var(--accent-alpha);
          font-weight: 600;
        }
        .dash-sidebar__link-icon { font-size: 0.95rem; width: 20px; text-align: center; flex-shrink: 0; }
        .dash-sidebar__badge {
          background: var(--danger); color: #fff; font-size: 0.65rem; font-weight: 700;
          padding: 0.1rem 0.4rem; border-radius: 999px; margin-left: auto;
        }
        .dash-content {
          flex: 1; min-width: 0; padding: 2rem;
        }
        .dash-layout__toggle {
          display: none; position: fixed; bottom: 1.25rem; right: 1.25rem;
          z-index: 60; background: var(--accent); color: #fff !important;
          border: none; border-radius: 999px; padding: 0.75rem 1.25rem;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          font-family: inherit; align-items: center; gap: 0.4rem; text-decoration: none;
        }
        .dash-layout__overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 49;
        }
        @media (max-width: 768px) {
          .dash-sidebar {
            position: fixed; top: var(--navbar-h); left: 0; z-index: 50;
            width: 280px; transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .dash-sidebar--open { transform: translateX(0); }
          .dash-layout__toggle { display: flex; }
          .dash-layout__overlay { display: block; }
          .dash-content { padding: 1.25rem 1rem 5rem; }
        }
      `}</style>

      {/* Mobile toggle */}
      <motion.button
        className="dash-layout__toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle sidebar"
      >
        <motion.span
          animate={{ rotate: sidebarOpen ? 90 : 0 }}
          transition={{ duration: 0.25, ease: FAUCET_EASING }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </motion.span>
        Menu
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="dash-layout__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar--open' : ''}`}>
        <div className="dash-sidebar__header">
          <motion.div
            className="dash-sidebar__avatar"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {initials}
          </motion.div>
          <div className="dash-sidebar__user-info">
            <div className="dash-sidebar__name">
              {user?.full_name || user?.email?.split('@')[0] || 'Dashboard'}
            </div>
            <div className="dash-sidebar__role">
              <span className={'dash-sidebar__role-badge ' + (isProvider ? 'badge-gold' : 'badge-info')}>
                {isProvider ? 'Provider' : 'Client'}
              </span>
            </div>
          </div>
        </div>

        <nav className="dash-sidebar__nav">
          {links.map((link, i) => (
            <motion.div
              key={link.href}
              custom={i}
              variants={DROP_VARIANTS}
              initial="hidden"
              animate="visible"
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Link
                href={link.href}
                className={`dash-sidebar__link ${isActive(link.href) ? 'dash-sidebar__link--active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <span className="dash-sidebar__link-icon">{link.icon}</span>
                <span style={{ flex: 1 }}>{link.label}</span>
                {link.href === '/dashboard/messages' && unreadCount > 0 && (
                  <motion.span
                    className="dash-sidebar__badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </Link>
            </motion.div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <motion.main
        className="dash-content"
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: FAUCET_EASING }}
      >
        {children}
      </motion.main>
    </div>
  );
}
