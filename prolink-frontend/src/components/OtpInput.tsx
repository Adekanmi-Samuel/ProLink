'use client';

import { useRef, useCallback } from 'react';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
}

export default function OtpInput({ length, value, onChange, disabled, error, success }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback((index: number, char: string) => {
    if (char && !/^\d$/.test(char)) return; // Only digits
    const arr = value.split('');
    arr[index] = char;
    const combined = arr.join('');
    onChange(combined);

    // Auto-advance to next
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }, [value, onChange, length]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move back if current is empty
        inputsRef.current[index - 1]?.focus();
      }
    }
  }, [value]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    onChange(text);
    // Focus the next empty or last box
    const focusIdx = Math.min(text.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  }, [onChange, length]);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => {
        const hasVal = !!value[i];
        const cls = `otp-box ${hasVal ? 'filled' : ''} ${success ? 'success' : ''} ${error && !hasVal ? 'error' : ''}`;
        return (
          <input
            key={i}
            ref={el => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ''}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={disabled}
            className={cls}
            style={{
              width: 48, height: 56,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1.6rem', textAlign: 'center',
              background: success ? 'var(--success-bg)' : error ? 'var(--danger-bg)' : 'var(--surface2)',
              border: `2px solid ${error ? 'var(--danger)' : success ? 'var(--success)' : hasVal ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius)',
              color: 'var(--fg)',
              caretColor: 'var(--accent)',
              outline: 'none',
              ...(success ? { animation: 'scaleIn 0.25s ease' } : {}),
            }}
            onFocus={e => {
              if (!error && !success) {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
              }
            }}
            onBlur={e => {
              e.target.style.boxShadow = 'none';
              if (!error && !success && !value[i]) {
                e.target.style.borderColor = 'var(--border2)';
              }
            }}
            aria-label={`Digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
