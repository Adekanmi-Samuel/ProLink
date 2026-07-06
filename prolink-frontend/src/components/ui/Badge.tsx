import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({ children, variant = 'primary', className = '', style }: BadgeProps) {
  const variantClass = `pl-badge-${variant}`;
  return (
    <span className={`pl-badge ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
}
