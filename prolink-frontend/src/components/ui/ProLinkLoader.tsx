import React from 'react';

export default function ProLinkLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-4" style={{ minHeight: '300px', backgroundColor: 'transparent' }}>
      <div
        className="navbar-logo"
        style={{ fontSize: '2.5rem', opacity: 0.9, animation: 'pulse 1.8s ease-in-out infinite' }}
      >
        <span className="navbar-logo-accent">Pro</span><span className="navbar-logo-fg">Link</span>
      </div>
      {message && <div style={{ color: 'var(--fg-secondary)', fontSize: '0.95rem' }}>{message}</div>}
    </div>
  );
}
