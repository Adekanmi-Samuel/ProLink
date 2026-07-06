import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  noPadding?: boolean;
}

export default function Card({ 
  children, 
  variant = 'default', 
  noPadding = false,
  className = '', 
  ...props 
}: CardProps) {
  const base = 'card';
  const variantMap = {
    default: '',
    bordered: 'card--bordered',
    elevated: 'card--elevated',
  };

  return (
    <div 
      className={`${base} ${variantMap[variant]} ${className}`}
      {...props}
    >
      <style>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: ${noPadding ? '0' : '1.5rem'};
          overflow: hidden;
          min-width: 0;
        }
        .card--bordered {
          border-color: var(--border-hover);
        }
        .card--elevated {
          box-shadow: var(--shadow);
        }
      `}</style>
      {children}
    </div>
  );
}
