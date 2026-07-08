import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function ReviewModal({ jobId, onClose, onSuccess }: { jobId: number, onClose: () => void, onSuccess: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/reviews', { jobId, rating, comment });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.msg || err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="review-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="review-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22,  1,  0.36,  1] as any }}
        >
          <button onClick={onClose} className="review-close-btn" aria-label="Close">✕</button>
          <h2 className="review-title">Leave a Review</h2>
          
          {errorMsg && (
            <div className="review-error">{errorMsg}</div>
          )}
          
          <form onSubmit={handleSubmit} className="review-form">
            <div>
              <label className="review-label">Rating (1-5)</label>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.6rem',
                      color: rating >= star ? 'var(--warning)' : 'var(--fg-tertiary)',
                      transition: 'color 0.2s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => { if (rating < star) e.currentTarget.style.color = 'var(--fg-secondary)'; }}
                    onMouseLeave={(e) => { if (rating < star) e.currentTarget.style.color = 'var(--fg-tertiary)'; }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="review-label">Review Comment</label>
              <textarea 
                rows={4}
                className="review-textarea"
                placeholder="Describe your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            <div className="review-actions">
              <button type="button" onClick={onClose} className="review-cancel">Cancel</button>
              <motion.button
                type="submit"
                disabled={submitting}
                className="review-submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      <style>{`
        .review-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          padding: 1rem;
        }
        .review-card {
          position: relative;
          background: var(--surface);
          padding: 1.75rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          width: 100%; max-width: 440px;
        }
        .review-close-btn {
          position: absolute; top: 1rem; right: 1rem;
          background: none; border: none; color: var(--fg-tertiary);
          font-size: 1.1rem; cursor: pointer;
          width: 32px; height: 32px; display: flex;
          align-items: center; justify-content: center;
          border-radius: 50%; transition: background 0.15s, color 0.15s;
        }
        .review-close-btn:hover { background: var(--surface-hover); color: var(--fg); }
        .review-title {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.25rem; font-weight: 800;
          color: var(--fg); margin-bottom: 1.25rem;
        }
        .review-error {
          background: var(--danger-bg); border: 1px solid var(--danger-border);
          color: var(--danger); padding: 0.7rem 1rem;
          border-radius: var(--radius); font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .review-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .review-label {
          display: block; font-size: 0.8rem; font-weight: 600;
          color: var(--fg-secondary); margin-bottom: 0.4rem;
          font-family: var(--font-heading), sans-serif;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .review-stars { display: flex; gap: 0.25rem; }
        .review-textarea {
          width: 100%;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          color: var(--fg);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          padding: 0.7rem 1rem;
          transition: border-color 0.2s;
          outline: none;
          resize: vertical;
        }
        .review-textarea:focus { border-color: var(--accent); }
        .review-textarea::placeholder { color: var(--fg-tertiary); }
        .review-actions {
          display: flex; justify-content: flex-end;
          gap: 0.75rem; margin-top: 0.5rem;
        }
        .review-cancel {
          padding: 0.6rem 1.2rem; border-radius: var(--radius);
          border: 1.5px solid var(--border); background: transparent;
          color: var(--fg-secondary); font-weight: 600; font-size: 0.85rem;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .review-cancel:hover { background: var(--surface); color: var(--fg); }
        .review-submit {
          padding: 0.6rem 1.4rem; border-radius: var(--radius);
          border: none; background: var(--accent); color: var(--accent-fg);
          font-weight: 600; font-size: 0.85rem; cursor: pointer;
          transition: opacity 0.15s;
        }
        .review-submit:disabled { opacity: 0.4; cursor: not-allowed; }
        .review-submit:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </AnimatePresence>
  );
}
