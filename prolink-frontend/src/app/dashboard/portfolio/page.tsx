'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';
import withAuth from '../../../components/withAuth';

const FAUCET_EASING = [0.22, 1, 0.36, 1];

function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', file_url_or_link: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setPortfolio(response.data.portfolio || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.post('/profiles/me/portfolio', formData);
      setFormData({ title: '', description: '', file_url_or_link: '' });
      fetchProfile();
    } catch (error) {
      setErrorMsg(error.response?.data?.msg || 'Failed to add item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: FAUCET_EASING }}
      >
        <div className="section-eyebrow" style={{ marginBottom: '0.5rem' }}>Show your work</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800 }}>Your portfolio</h1>
        <p style={{ color: 'var(--fg-secondary)', marginTop: '0.4rem', marginBottom: '2rem', fontSize: '0.92rem' }}>
          Showcase your best work to win more jobs from clients.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Add form */}
        <motion.div
          className="card glass"
          style={{ padding: '1.75rem' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: FAUCET_EASING }}
        >
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>Add new item</div>
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1.5px solid var(--danger)',
                  color: 'var(--danger)', borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem',
                  fontSize: '0.82rem', marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label htmlFor="title-portfolio" className="field-label">Title</label>
              <input id="title-portfolio" name="title" type="text" required value={formData.title} onChange={handleChange} className="field" placeholder="e.g., E-commerce website redesign" />
            </div>
            <div>
              <label htmlFor="desc-portfolio" className="field-label">Description</label>
              <textarea id="desc-portfolio" name="description" rows={4} value={formData.description} onChange={handleChange} className="field" placeholder="Briefly describe the project and your role…" />
            </div>
            <div>
              <label htmlFor="link-portfolio" className="field-label">Link / file URL</label>
              <input id="link-portfolio" name="file_url_or_link" type="url" value={formData.file_url_or_link} onChange={handleChange} className="field" placeholder="https://…" />
            </div>
            <motion.button
              type="submit"
              disabled={submitting}
              className="btn btn-accent"
              style={{ width: '100%', padding: '0.8rem' }}
              whileHover={{ y: -1, boxShadow: '0 4px 20px var(--accent-alpha)' }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  Adding…
                </span>
              ) : '+ Add to portfolio'}
            </motion.button>
          </form>
        </motion.div>

        {/* Portfolio list */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: FAUCET_EASING }}
        >
          <div className="section-eyebrow" style={{ marginBottom: '1rem' }}>Your items ({portfolio.length})</div>
          {portfolio.length > 0 ? (
            <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {portfolio.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 * i, ease: FAUCET_EASING }}
                    whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
                    className="card glass"
                    style={{ padding: '1.25rem 1.5rem', cursor: 'default' }}
                  >
                    <a href={item.file_url_or_link || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg)' }}>{item.title}</h3>
                      {item.description && (
                        <p style={{ color: 'var(--fg-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', lineHeight: 1.6 }}>{item.description}</p>
                      )}
                      {item.file_url_or_link && (
                        <motion.span
                          style={{ display: 'inline-block', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem' }}
                          whileHover={{ x: 4 }}
                        >
                          View link →
                        </motion.span>
                      )}
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              className="card"
              style={{ padding: '2rem', textAlign: 'center' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p style={{ color: 'var(--fg-tertiary)' }}>No portfolio items yet — add your first one.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(PortfolioPage);
