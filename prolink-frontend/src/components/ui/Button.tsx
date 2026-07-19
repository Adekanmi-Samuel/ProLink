import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const variantClass = `pl-btn-${variant}`;
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.4rem 0.8rem', fontSize: '0.8rem' },
    md: {},
    lg: { padding: '0.85rem 1.75rem', fontSize: '0.95rem' },
  };

  return (
    <button 
      className={`pl-btn ${variantClass} ${className}`} 
      disabled={isLoading || disabled}
      style={sizeStyles[size]}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
