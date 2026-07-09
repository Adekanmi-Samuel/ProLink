'use client';

import Button from '@/components/ui/Button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 mb-6 rounded-full bg-danger/10 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--fg)' }}>
        Admin Panel Error
      </h1>
      <p className="mb-8 max-w-md" style={{ color: 'var(--fg-secondary)' }}>
        An error occurred while loading the admin panel. Please try again or contact support.
      </p>
      <div className="flex gap-4">
        <Button variant="accent" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = '/admin')}>
          Reload Admin
        </Button>
      </div>
    </div>
  );
}
