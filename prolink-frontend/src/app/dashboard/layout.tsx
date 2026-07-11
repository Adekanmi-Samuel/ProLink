'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  LayoutDashboard, User, Briefcase, FileText, 
  Settings, MessageSquare, Wallet, Search, Bookmark, Menu, X, Plus, LogOut, CheckCircle, ShieldAlert, Users, Star
} from 'lucide-react';
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
    { href: '/dashboard',              label: 'Overview',        icon: <LayoutDashboard size={16}/> },
    { href: '/jobs',                   label: 'Find Work',       icon: <Search size={16}/> },
    { href: '/dashboard/saved-jobs',   label: 'Saved Jobs',      icon: <Bookmark size={16}/> },
    { href: '/dashboard/my-bids',      label: 'My Proposals',    icon: <FileText size={16}/> },
    { href: '/dashboard/contracts',    label: 'Contracts',       icon: <Briefcase size={16}/> },
    { href: '/dashboard/my-services',  label: 'My Services',     icon: <Briefcase size={16}/> },
    { href: '/dashboard/messages',     label: 'Messages',        icon: <MessageSquare size={16}/> },
    { href: '/dashboard/wallet',       label: 'Earnings',        icon: <Wallet size={16}/> },
    { href: '/profile/edit',           label: 'Profile',         icon: <User size={16}/> },
    { href: '/dashboard/premium',      label: 'Premium',         icon: <Star size={16}/> },
  ];

  const clientLinks = [
    { href: '/dashboard',              label: 'Overview',        icon: <LayoutDashboard size={16}/> },
    { href: '/jobs/new',               label: 'Post a Job',      icon: <Plus size={16}/> },
    { href: '/dashboard/my-jobs',      label: 'My Jobs',         icon: <Briefcase size={16}/> },
    { href: '/dashboard/messages',     label: 'Messages',        icon: <MessageSquare size={16}/> },
    { href: '/dashboard/wallet',       label: 'Billing',         icon: <Wallet size={16}/> },
    { href: '/profile/edit',           label: 'Profile',         icon: <User size={16}/> },
    { href: '/dashboard/premium',      label: 'Premium',         icon: <Star size={16}/> },
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
          width: 260px; background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          height: calc(100vh - var(--navbar-h)); position: sticky; top: var(--navbar-h); overflow-y: auto;
          flex-shrink: 0;
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
          border-left: 3px solid var(--accent);
          padding-left: calc(0.75rem - 3px);
        }
        .dash-sidebar__link-icon { font-size: 0.95rem; width: 20px; text-align: center; flex-shrink: 0; }
        .dash-sidebar__badge {
          background: var(--danger); color: #fff; font-size: 0.65rem; font-weight: 700;
          padding: 0.1rem 0.4rem; border-radius: 999px; margin-left: auto;
        }
        .dash-content {
          flex: 1; min-width: 0; padding: 2rem;
        }
        .dash-mobile-topbar {
          display: none;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .dash-mobile-topbar__toggle {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.5rem;
          cursor: pointer;
          color: var(--fg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dash-mobile-topbar__toggle:hover {
          background: var(--accent-alpha);
          border-color: var(--accent);
          color: var(--accent);
        }
        .dash-mobile-topbar__title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--fg);
          font-family: var(--font-heading), sans-serif;
          flex: 1;
        }
        .dash-mobile-topbar__badge {
          background: var(--danger);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          text-decoration: none;
        }
        .dash-layout__overlay {
          display: none; position: fixed; inset: 0;
          background: transparent; backdrop-filter: none; z-index: 49;
        }
        @media (max-width: 768px) {
          .dash-sidebar {
            position: fixed; top: var(--navbar-h); left: 0; z-index: 50;
            width: 280px; transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .dash-sidebar--open { transform: translateX(0); }
          .dash-mobile-topbar { display: flex; }
          .dash-sidebar__close { display: block !important; }
          .dash-layout__overlay { display: block; }
          .dash-content { padding: calc(1.25rem + var(--navbar-h)) 1rem 5rem; }
        }
        @media (min-width: 769px) {
          .dash-mobile-topbar { display: none !important; }
        }
      `}</style>



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
          <button
            className="dash-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            style={{ marginLeft: 'auto', background: 'none', border: 'none',
                     cursor: 'pointer', color: 'var(--fg-tertiary)', padding: '0.25rem',
                     borderRadius: 'var(--radius)', display: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="dash-sidebar__nav">
          {/* For providers: group links into sections */}
          {isProvider ? (
            <>
              <div className="dash-sidebar__section-label">Work</div>
              {[providerLinks[0], providerLinks[1], providerLinks[2], providerLinks[3]].map((link, i) => (
                <motion.div key={link.href} custom={i} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 3 }}>
                  <Link href={link.href} className={`dash-sidebar__link ${isActive(link.href) ? 'dash-sidebar__link--active' : ''}`}>
                    <span className="dash-sidebar__link-icon">{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className="dash-sidebar__badge">{unreadCount}</span>
                    )}
                  </Link>
                </motion.div>
              ))}
              <div className="dash-sidebar__divider" />
              <div className="dash-sidebar__section-label">Account</div>
              {[providerLinks[4], providerLinks[5], providerLinks[6], providerLinks[7]].map((link, i) => (
                <motion.div key={link.href} custom={i + 4} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 3 }}>
                  <Link href={link.href} className={`dash-sidebar__link ${isActive(link.href) ? 'dash-sidebar__link--active' : ''}`}>
                    <span className="dash-sidebar__link-icon">{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className="dash-sidebar__badge">{unreadCount}</span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </>
          ) : (
            /* For clients: same pattern */
            <>
              <div className="dash-sidebar__section-label">Hire</div>
              {[clientLinks[0], clientLinks[1], clientLinks[2]].map((link, i) => (
                <motion.div key={link.href} custom={i} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 3 }}>
                  <Link href={link.href} className={`dash-sidebar__link ${isActive(link.href) ? 'dash-sidebar__link--active' : ''}`}>
                    <span className="dash-sidebar__link-icon">{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className="dash-sidebar__badge">{unreadCount}</span>
                    )}
                  </Link>
                </motion.div>
              ))}
              <div className="dash-sidebar__divider" />
              <div className="dash-sidebar__section-label">Account</div>
              {[clientLinks[3], clientLinks[4], clientLinks[5]].map((link, i) => (
                <motion.div key={link.href} custom={i + 4} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 3 }}>
                  <Link href={link.href} className={`dash-sidebar__link ${isActive(link.href) ? 'dash-sidebar__link--active' : ''}`}>
                    <span className="dash-sidebar__link-icon">{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className="dash-sidebar__badge">{unreadCount}</span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </>
          )}
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
        {/* Mobile nav bar — only visible on mobile (desktop sidebar handles nav) */}
        <div className="dash-mobile-topbar">
          <button
            className="dash-mobile-topbar__toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="15" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="dash-mobile-topbar__title">
            {pathname === '/dashboard' ? 'Dashboard'
              : pathname.includes('messages') ? 'Messages'
              : pathname.includes('wallet') ? 'Wallet'
              : pathname.includes('contracts') ? 'Contracts'
              : pathname.includes('my-jobs') ? 'My Jobs'
              : pathname.includes('my-bids') ? 'My Proposals'
              : pathname.includes('portfolio') ? 'Portfolio'
              : pathname.includes('verification') ? 'Verification'
              : 'Dashboard'}
          </span>
          {unreadCount > 0 && (
            <Link href="/dashboard/messages" className="dash-mobile-topbar__badge">
              {unreadCount} unread
            </Link>
          )}
        </div>
        {children}
      </motion.main>
    </div>
  );
}
