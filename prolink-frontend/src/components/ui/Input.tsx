import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label htmlFor={id} className="pl-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`pl-input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {hint && !error && (
        <span style={{ color: 'var(--muted2)', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
          {error}
        </span>
      )}
      <style>{`
        .input-error {
          border-color: var(--danger) !important;
        }
        .input-error:focus {
          box-shadow: 0 0 0 3px var(--danger-bg) !important;
        }
      `}</style>
    </div>
  );
}
