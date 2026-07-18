'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Link from 'next/link';
import {
  LayoutDashboard, User, Briefcase, FileText,
  MessageSquare, Wallet, Search, Bookmark, Menu, X, Plus, LogOut, Star
} from 'lucide-react';
import api from '../../lib/api';
import styles from './layout.module.css';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/profiles/me');
        setUser(res.data);
      } catch (err: any) {
        // Redirect to login on definitive 401
        if (err?.response?.status === 401) {
          router.replace('/login');
        }
      }
    };
    fetchUser();
  }, [router]);

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
    <div className={styles['dash-layout']}>
      {/* Skip navigation link — visible only on keyboard focus (WCAG 2.4.1 Bypass Blocks) */}
      <a
        href="#dash-main-content"
        className="skip-link"
      >
        Skip to main content
      </a>



      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.dashLayoutOverlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles['dash-sidebar']} ${sidebarOpen ? styles['dash-sidebar--open'] : ''}`}>
        <div className={styles['dash-sidebar__header']}>
          <div
            className={styles['dash-sidebar__avatar']}
          >
            {initials}
          </div>
          <div className={styles['dash-sidebar__user-info']}>
            <div className={styles['dash-sidebar__name']}>
              {user?.full_name || user?.email?.split('@')[0] || 'Dashboard'}
            </div>
            <div className={styles['dash-sidebar__role']}>
              <span className={styles['dash-sidebar__role-badge'] + ' ' + (isProvider ? 'badge-gold' : 'badge-info')}>
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

        <nav className={styles['dash-sidebar__nav']}>
          {/* For providers: group links into sections */}
          {isProvider ? (
            <>
              <div className="dash-sidebar__section-label">Work</div>
              {[providerLinks[0], providerLinks[1], providerLinks[2], providerLinks[3]].map((link, i) => (
                <div key={link.href}>
                  <Link href={link.href} className={`${styles['dash-sidebar__link']} ${isActive(link.href) ? styles['dash-sidebar__link--active'] : ''}`}>
                    <span className={styles['dash-sidebar__link-icon']}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className={styles['dash-sidebar__badge']}>{unreadCount}</span>
                    )}
                  </Link>
                </div>
              ))}
              <div className="dash-sidebar__divider" />
              <div className="dash-sidebar__section-label">Account</div>
              {providerLinks.slice(4).map((link, i) => (
                <div key={link.href}>
                  <Link href={link.href} className={`${styles['dash-sidebar__link']} ${isActive(link.href) ? styles['dash-sidebar__link--active'] : ''}`}>
                    <span className={styles['dash-sidebar__link-icon']}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className={styles['dash-sidebar__badge']}>{unreadCount}</span>
                    )}
                  </Link>
                </div>
              ))}
            </>
          ) : (
            /* For clients: same pattern */
            <>
              <div className="dash-sidebar__section-label">Hire</div>
              {[clientLinks[0], clientLinks[1], clientLinks[2]].map((link, i) => (
                <div key={link.href}>
                  <Link href={link.href} className={`${styles['dash-sidebar__link']} ${isActive(link.href) ? styles['dash-sidebar__link--active'] : ''}`}>
                    <span className={styles['dash-sidebar__link-icon']}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className={styles['dash-sidebar__badge']}>{unreadCount}</span>
                    )}
                  </Link>
                </div>
              ))}
              <div className="dash-sidebar__divider" />
              <div className="dash-sidebar__section-label">Account</div>
              {clientLinks.slice(3).map((link, i) => (
                <div key={link.href}>
                  <Link href={link.href} className={`${styles['dash-sidebar__link']} ${isActive(link.href) ? styles['dash-sidebar__link--active'] : ''}`}>
                    <span className={styles['dash-sidebar__link-icon']}>{link.icon}</span>
                    <span style={{ flex: 1 }}>{link.label}</span>
                    {link.href === '/dashboard/messages' && unreadCount > 0 && (
                      <span className={styles['dash-sidebar__badge']}>{unreadCount}</span>
                    )}
                  </Link>
                </div>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        id="dash-main-content"
        className={styles['dash-content']}
      >
        {/* Mobile nav bar — only visible on mobile (desktop sidebar handles nav) */}
        <div className={styles['dash-mobile-topbar']}>
          <button
            className={styles['dash-mobile-topbar__toggle']}
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
          <span className={styles['dash-mobile-topbar__title']}>
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
            <Link href="/dashboard/messages" className={styles['dash-mobile-topbar__badge']}>
              {unreadCount} unread
            </Link>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
