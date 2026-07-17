'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../lib/api';
import styles from './layout.module.css';
import ProLinkLoader from '../../components/ui/ProLinkLoader';

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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  // Admin role guard — redirect non-admins to /dashboard
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get('/profiles/me');
        if (res.data.user_type !== 'admin') {
          router.push('/dashboard');
          return;
        }
      } catch {
        router.push('/login');
        return;
      } finally {
        setAdminLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

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

  if (adminLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <ProLinkLoader />
      </div>
    );
  }

  return (
    <div className={styles['admin-layout']}>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className={styles.adminLayoutOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`${styles['admin-sidebar']} ${sidebarOpen ? styles['admin-sidebar--open'] : ''}`}>
        <div className={styles['admin-sidebar__header']}>
          <motion.div className={styles['admin-sidebar__icon']} whileHover={{ scale: 1.1, rotate: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            👑
          </motion.div>
          <div className={styles['admin-sidebar__title']}>
            <div className={styles['admin-sidebar__name']}>ProLink Admin</div>
            <div className={styles['admin-sidebar__role']}>System Management</div>
          </div>
        </div>

        <nav className={styles['admin-sidebar__nav']}>
          {links.map((link, i) => (
            <motion.div key={link.href} custom={i} variants={DROP_VARIANTS} initial="hidden" animate="visible" whileHover={{ x: 4 }}>
              <Link
                href={link.href}
                className={`${styles['admin-sidebar__link']} ${isActive(link.href) ? styles['admin-sidebar__link--active'] : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
              >
                <span className={styles['admin-sidebar__link-icon']}>{link.icon}</span>
                {link.label}
              </Link>
            </motion.div>
          ))}
        </nav>
      </aside>

      <main className={styles['admin-content']}>
        <div className={styles['dash-mobile-topbar']} style={{ marginBottom: '1.5rem' }}>
          <button
            className={styles['dash-mobile-topbar__toggle']}
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
          <span className={styles['dash-mobile-topbar__title']}>Admin Panel</span>
        </div>
        {children}
      </main>
    </div>
  );
}
