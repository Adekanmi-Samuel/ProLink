import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    // Only show once per device/browser session
    const hasSeenTutorial = document.cookie.includes('prolink_tutorial_seen=1');
    if (!hasSeenTutorial) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    document.cookie = 'prolink_tutorial_seen=1; path=/; max-age=31536000; SameSite=Lax';
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleClose();
  };

  const skipTutorial = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal fade-up">
        <button className="tutorial-close" onClick={skipTutorial}>✕</button>
        
        <div className="tutorial-content">
          {step === 1 && (
            <div className="tutorial-step">
              <div className="tutorial-icon">👋</div>
              <h3>Welcome to ProLink!</h3>
              <p>Your secure platform for freelance work. Whether you're here to hire top talent or find great projects, we've got you covered.</p>
            </div>
          )}
          
          {step === 2 && (
            <div className="tutorial-step">
              <div className="tutorial-icon">💼</div>
              <h3>For Clients: Posting Jobs</h3>
              <p>Click <strong>"Post a Job"</strong> to describe what you need. You can hire for a <strong>Fixed Price</strong> or split the work into <strong>Project Stages</strong> to pay as work gets done.</p>
            </div>
          )}

          {step === 3 && (
            <div className="tutorial-step">
              <div className="tutorial-icon">🚀</div>
              <h3>For Providers: Winning Work</h3>
              <p>Browse the <strong>Job Board</strong> and submit proposals. Make sure your <strong>Portfolio</strong> is up to date to stand out from the crowd.</p>
            </div>
          )}

          {step === 4 && (
            <div className="tutorial-step">
              <div className="tutorial-icon">🛡️</div>
              <h3>Safe Escrow Payments</h3>
              <p>We hold funds securely in Escrow. Providers know they'll get paid, and clients only release funds when they are satisfied with the work.</p>
            </div>
          )}

          <div className="tutorial-dots">
            {[1, 2, 3, 4].map(s => (
              <span key={s} className={`tutorial-dot ${step === s ? 'active' : ''}`} />
            ))}
          </div>

          <div className="tutorial-actions">
            <button className="pl-btn pl-btn-ghost" onClick={skipTutorial}>Skip</button>
            <button className="pl-btn pl-btn-primary" onClick={nextStep}>
              {step === 4 ? "Let's Go! 🚀" : "Next"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .tutorial-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .tutorial-modal {
          background: var(--surface);
          border: 1px solid var(--primary-alpha);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 450px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        .tutorial-close {
          position: absolute;
          top: 1rem; right: 1rem;
          background: none; border: none;
          color: var(--muted);
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 10;
        }
        .tutorial-close:hover { color: var(--fg); }
        .tutorial-content {
          padding: 2.5rem 2rem 2rem 2rem;
        }
        .tutorial-step {
          text-align: center;
          animation: fadeUp 0.3s ease;
        }
        .tutorial-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }
        .tutorial-step h3 {
          font-family: var(--font-outfit), sans-serif;
          font-size: 1.4rem;
          color: var(--fg);
          margin-bottom: 0.75rem;
        }
        .tutorial-step p {
          color: var(--fg2);
          line-height: 1.6;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }
        .tutorial-step strong {
          color: var(--primary-light);
        }
        .tutorial-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .tutorial-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--surface2);
          transition: all 0.3s ease;
        }
        .tutorial-dot.active {
          background: var(--primary);
          transform: scale(1.3);
        }
        .tutorial-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
