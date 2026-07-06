'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const FAUCET_EASING = [0.22, 1, 0.36, 1];
const DROP_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.4, delay: 0.08 * i, ease: FAUCET_EASING },
  }),
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const links = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/verifications', label: 'Verifications', icon: '🛡️' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/jobs', label: 'Jobs', icon: '💼' },
    { href: '/admin/disputes', label: 'Disputes', icon: '⚖️' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="admin-layout">
      <style>{`
        .admin-layout { display: flex; min-height: calc(100vh - var(--navbar-h)); background: var(--bg); }
        .admin-sidebar {
          width: var(--sidebar-w); flex-shrink: 0; background: var(--bg);
          border-right: 1px solid var(--border); position: sticky;
          top: var(--navbar-h); height: calc(100vh - var(--navbar-h));
          overflow-y: auto; display: flex; flex-direction: column; padding: 1.5rem 0;
        }
        .admin-sidebar__header {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0 1.25rem 1.25rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem;
        }
        .admin-sidebar__icon {
          width: 40px; height: 40px; border-radius: var(--radius); flex-shrink: 0;
          background: var(--accent-alpha); color: var(--accent);
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .admin-sidebar__title { min-width: 0; }
        .admin-sidebar__name {
          font-family: var(--font-heading), sans-serif; font-size: 0.95rem; font-weight: 800; color: var(--fg);
        }
        .admin-sidebar__role { font-size: 0.72rem; color: var(--fg-tertiary); margin-top: 2px; }
        .admin-sidebar__nav { display: flex; flex-direction: column; gap: 2px; padding: 0 0.75rem; }
        .admin-sidebar__link {
          display: flex; align-items: center; gap: 0.65rem; padding: 0.55rem 0.75rem;
          font-size: 0.85rem; font-weight: 500; color: var(--fg-secondary);
          border-radius: var(--radius); text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .admin-sidebar__link:hover { color: var(--fg); background: var(--accent-alpha); }
        .admin-sidebar__link--active { color: var(--accent) !important; background: var(--accent-alpha); font-weight: 600; }
        .admin-sidebar__link-icon { font-size: 0.95rem; width: 20px; text-align: center; flex-shrink: 0; }
        .admin-content { flex: 1; min-width: 0; padding: 2rem; }
        .admin-table, .verify-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .verify-table th, .admin-table td, .verify-table td { padding: 0.65rem 0.85rem; text-align: left; font-size: 0.85rem; }
        .admin-table th, .verify-table th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--fg-tertiary); position: sticky; top: 0; background: var(--surface-hover); }
        .admin-table td, .verify-table td { font-size: 0.85rem; }
        .dash-mobile-topbar {
          display: none;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .dash-mobile-topbar__toggle {
          background: var(--surface);
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
        .admin-layout__overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 49;
        }
        @media (max-width: 768px) {
          .admin-sidebar { position: fixed; top: var(--navbar-h); left: 0; z-index: 50; width: 280px; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
          .admin-sidebar--open { transform: translateX(0); }
          .dash-mobile-topbar { display: flex; }
          .admin-layout__overlay { display: block; }
          .admin-content { padding: calc(1.25rem + var(--navbar-h)) 1rem 5rem; }
        }
      `}</style>



      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="admin-layout__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <motion.div className="admin-sidebar__icon" whileHover={{ scale: 1.1, rotate: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            👑
          </motion.div>
          <div className="admin-sidebar__title">
            <div className="admin-sidebar__name">ProLink Admin</div>
            <div className="admin-sidebar__role">System Management</div>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {links.map((link, i) => (
            <motion.div key={link.href} custom={i} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 4 }}>
              <Link
                href={link.href}
                className={`admin-sidebar__link ${isActive(link.href) ? 'admin-sidebar__link--active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <span className="admin-sidebar__link-icon">{link.icon}</span>
                {link.label}
              </Link>
            </motion.div>
          ))}
        </nav>
      </aside>

      <motion.main className="admin-content" key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: FAUCET_EASING }}>
        <div className="dash-mobile-topbar" style={{ marginBottom: '1.5rem' }}>
          <button
            className="dash-mobile-topbar__toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin nav"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="15" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="dash-mobile-topbar__title">Admin Panel</span>
        </div>
        {children}
      </motion.main>
    </div>
  );
}
