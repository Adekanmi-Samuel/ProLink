'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function MessagesPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await api.get('/chats');
        setThreads(response.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--fg-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Loading...</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
      >
        <div className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Conversations</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>Messages</h1>
        <p style={{ color: 'var(--fg-secondary)', marginTop: '0.3rem', marginBottom: '2rem', fontSize: '0.92rem' }}>
          Your conversations with clients and providers.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence>
          {threads.length > 0 ? (
            threads.map((thread, i) => (
              <motion.div
                key={thread.thread_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 * i, ease: FAUCET_EASING }}
                whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' }}
                className="card glass"
                style={{ padding: '1.1rem 1.25rem' }}
              >
                <Link href={`/chat/${thread.thread_id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    border: '2px solid var(--border)', background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700, color: 'var(--accent)',
                  }}>
                    {thread.other_user_avatar ? (
                      <img src={thread.other_user_avatar} alt={thread.other_user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (thread.other_user_name || '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--fg)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thread.other_user_name}
                      </span>
                      <span style={{ color: 'var(--fg-tertiary)', fontSize: '0.7rem', flexShrink: 0, fontFamily: 'var(--font-mono), monospace' }}>
                        {timeAgo(thread.last_message_at)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, margin: '0.2rem 0 0' }}>
                      Re: {thread.job_title}
                    </p>
                    {thread.last_message && (
                      <p style={{ color: 'var(--fg-tertiary)', fontSize: '0.85rem', margin: '0.3rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thread.last_message}
                      </p>
                    )}
                  </div>
                  {thread.unread_count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      style={{
                        background: 'var(--accent)', color: '#fff', fontSize: '0.65rem',
                        fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 999,
                        minWidth: 20, textAlign: 'center', flexShrink: 0,
                      }}
                    >
                      {thread.unread_count}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="card"
              style={{ padding: '3rem', textAlign: 'center' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p style={{ color: 'var(--fg-tertiary)' }}>You have no active conversations yet.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default withAuth(MessagesPage);
