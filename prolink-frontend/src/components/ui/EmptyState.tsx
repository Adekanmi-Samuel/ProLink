import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass" style={{ borderStyle: 'dashed', borderRadius: 'var(--radius-lg)' }}>
      {icon && <div className="text-4xl mb-4" style={{ color: 'var(--muted2)' }}>{icon}</div>}
      <h3 className="heading-font text-lg font-semibold mb-2">{title}</h3>
      <p style={{ color: 'var(--muted)', maxWidth: 400, marginBottom: action ? '1.5rem' : 0 }}>
        {description}
      </p>
      {action}
    </div>
  );
}
