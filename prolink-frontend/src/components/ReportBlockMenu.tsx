import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';

interface Props {
  userId: number; // The user being reported or blocked
  jobId?: number;
  messageId?: number;
}

export default function ReportBlockMenu({ userId, jobId, messageId }: Props) {
  const [open, setOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBlock = async () => {
    if (!window.confirm("Are you sure you want to block this user? They will not be able to interact with you anymore.")) return;
    try {
      await api.post('/moderation/blocks', { blockedId: userId });
      alert("User blocked successfully.");
      setOpen(false);
      // Optional: redirect to home or refresh
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to block user");
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/moderation/reports', {
        reportedUserId: userId,
        jobId,
        messageId,
        reason: reportReason
      });
      alert("Report submitted successfully.");
      setShowReportModal(false);
      setReportReason('');
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-[var(--muted)] hover:text-white rounded-full hover:bg-[var(--surface-hover)] transition"
        title="More options"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[var(--surface)] ring-1 ring-black ring-opacity-5 divide-y divide-[var(--border)] focus:outline-none z-10 border border-[var(--border)]">
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); setShowReportModal(true); }}
              className="group flex items-center px-4 py-2 text-sm text-[var(--fg)] hover:bg-[var(--surface-hover)] w-full text-left"
            >
              🚩 Report
            </button>
            <button
              onClick={handleBlock}
              className="group flex items-center px-4 py-2 text-sm text-\[var\(--danger\)\] hover:bg-\[var\(--danger-bg\)\] w-full text-left"
            >
              🚫 Block
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--surface)] p-6 rounded-xl shadow-xl w-full max-w-md border border-[var(--border)] relative">
            <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-[var(--muted)] hover:text-white">✕</button>
            <h2 className="text-xl font-bold mb-4 text-white">Report User</h2>
            
            <form onSubmit={handleReport} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Reason for reporting</label>
                <textarea 
                  rows={4} 
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--accent)]" 
                  placeholder="Please provide details about the abuse, spam, or inappropriate behavior..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)]">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg \[var\(--danger\)\] hover:bg-\[var\(--danger\)\] text-white disabled:opacity-50 transition">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
