'use client';

import Button from '@/components/ui/Button';

export default function DashboardError({
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
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--fg)' }}>
        Dashboard Error
      </h1>
      <p className="mb-8 max-w-md" style={{ color: 'var(--fg-secondary)' }}>
        We encountered an error while loading your dashboard. This might be a temporary issue.
      </p>
      <div className="flex gap-4">
        <Button variant="accent" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
