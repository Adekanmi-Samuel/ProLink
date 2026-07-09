'use client';

import Button from '@/components/ui/Button';

export default function ChatError({
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--fg)' }}>
        Chat Error
      </h1>
      <p className="mb-8 max-w-md" style={{ color: 'var(--fg-secondary)' }}>
        We encountered an error while loading this conversation. Please try again.
      </p>
      <div className="flex gap-4">
        <Button variant="accent" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = '/chat')}>
          Back to Chats
        </Button>
      </div>
    </div>
  );
}
