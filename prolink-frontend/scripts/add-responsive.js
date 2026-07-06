const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'src/app/globals.css');
let c = fs.readFileSync(fp, 'utf8');

// Find the responsive section using indexOf with the exact content
const startMarker = 'RESPONSIVE';
const endMarker = 'LINE CLAMP UTILITY';

const startIdx = c.indexOf('   RESPONSIVE');
const endIdx = c.indexOf('   LINE CLAMP UTILITY');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

// Go back to find the comment block start and go forward past the end brace
const sectionStart = c.lastIndexOf('/*', startIdx);
const sectionEnd = c.indexOf('}\n', endIdx) + 2; // include closing brace

const before = c.slice(0, sectionStart);
const after = c.slice(sectionEnd);

const newSection = `/* ═══════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════ */

/* ── Small Tablet / Large Phone (≤1024px) ── */
@media (max-width: 1024px) {
  :root {
    --sidebar-w: 220px;
  }
  .dash-stats { grid-template-columns: repeat(2, 1fr) !important; }
  .contracts-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .pl-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}

/* ── Tablet / Large Phone (≤860px) ── */
@media (max-width: 860px) {
  .dash-main-grid { grid-template-columns: 1fr !important; }
  .dash-sidebar { display: none; }
  .job-detail__layout { grid-template-columns: 1fr !important; }
  .job-detail__sidebar { order: -1; }
  .wallet-cards { grid-template-columns: 1fr 1fr !important; }
  .talent-grid { grid-template-columns: repeat(2, 1fr) !important; }
}

/* ── Phone (≤768px) ── */
@media (max-width: 768px) {
  :root {
    --sidebar-w: 0px;
    --navbar-h: 56px;
  }
  .pl-page { padding: 1rem 0.75rem; }
  .pl-container, .pl-container-sm, .pl-container-xs { padding: 0 0.75rem; }

  /* Typography scale */
  h1 { font-size: 1.5rem !important; }
  h2 { font-size: 1.25rem !important; }
  h3 { font-size: 1.1rem !important; }
  body { font-size: 0.9rem; }
  .h-display { font-size: clamp(1.5rem, 6vw, 2rem) !important; }

  /* Jobs filter drawer */
  .jobs-layout { grid-template-columns: 1fr !important; }
  .jobs-filters { display: none; }
  .jobs-filters.jobs-filters--open {
    display: block;
    position: fixed;
    inset: 0; z-index: 100;
    background: var(--bg);
    padding: 1.25rem;
    overflow-y: auto;
    animation: fadeIn 0.2s ease;
  }
  .jobs-filters__toggle { display: flex !important; }

  /* Job cards */
  .job-card { padding: 1rem !important; }
  .job-card__top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .job-card__budget { font-size: 0.95rem; }
  .job-card__desc { font-size: 0.85rem; }

  /* Job detail */
  .job-detail__header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .job-detail__title { font-size: 1.25rem !important; }

  /* Dashboard */
  .dash-stats { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
  .dash-stat { padding: 1rem !important; }
  .dash-stat__value { font-size: 1.1rem !important; }
  .dash-stat__icon { width: 36px !important; height: 36px !important; font-size: 1rem !important; }
  .dash-main-content { padding: 1rem !important; }
  .dash-section-title { font-size: 1rem !important; }

  /* Wallet */
  .wallet-cards { grid-template-columns: 1fr !important; }
  .earnings-card__value { font-size: 1.5rem !important; }

  /* Contracts */
  .contracts-grid { grid-template-columns: 1fr !important; }
  .contract-card { padding: 1rem !important; }

  /* Bids */
  .bid-card { padding: 1rem !important; }
  .bid-card__top { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .bid-card__amount { font-size: 0.95rem; }

  /* Talent */
  .talent-grid { grid-template-columns: 1fr !important; }
  .talent-card__info { flex-direction: column; text-align: center; }

  /* Profile & Job forms */
  .profile-form { padding: 1rem !important; }
  .profile-form .flex-row,
  .job-create-form .flex-row { flex-direction: column; }
  .job-create-form { padding: 1rem !important; }

  /* Stage cards */
  .stage-card { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
  .stage-card__actions { width: 100%; display: flex; gap: 0.5rem; }
  .stages-section__form { flex-direction: column !important; }

  /* Dispute layout */
  .dispute-layout { grid-template-columns: 1fr !important; }

  /* Tables */
  .pl-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -0.75rem; padding: 0 0.75rem; }
  .pl-table { min-width: 600px; }
  .pl-table th, .pl-table td { padding: 0.6rem 0.75rem !important; font-size: 0.8rem !important; }

  /* Modals */
  .pl-modal { width: calc(100% - 2rem) !important; max-width: none !important; margin: 0 1rem !important; border-radius: var(--radius-lg) !important; max-height: 90vh !important; overflow-y: auto; }

  /* Chat */
  .chat-window { height: calc(100vh - 120px) !important; border-radius: var(--radius) !important; max-width: none !important; margin: 0 !important; }
  .chat-window-header { padding: 0.75rem !important; }
  .chat-window-messages { padding: 0.75rem !important; }
  .chat-window-input-wrap { padding: 0.75rem !important; }

  /* Notifications */
  .notification-list .notification-item { padding: 0.75rem !important; }

  /* Toast */
  .verify-toast { bottom: 0.75rem !important; right: 0.75rem !important; left: 0.75rem !important; max-width: none !important; }

  /* iOS input fix */
  input, select, textarea { font-size: 16px !important; }
}

/* ── Small Phone (≤480px) ── */
@media (max-width: 480px) {
  .dash-stats { grid-template-columns: 1fr !important; }
  .dash-stat__value { font-size: 1rem !important; }
  .pl-modal { width: calc(100% - 1rem) !important; margin: 0 0.5rem !important; }
  .prolink-nav__inner { padding: 0 0.5rem !important; gap: 0.5rem; }
  .prolink-nav__user-info { display: none !important; }
  .prolink-nav__auth { gap: 0.4rem; }
  .prolink-nav__login-link { font-size: 0.8rem; padding: 0.3rem; }
}

`;

c = before + newSection + after;
fs.writeFileSync(fp, c, 'utf8');
console.log('✅ Responsive CSS updated successfully');
