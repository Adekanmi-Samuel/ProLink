'use client';

import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Generic empty state component
 */
export function EmptyState({ 
  title, 
  description, 
  icon = '📭',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="pl-btn pl-btn-primary empty-state-btn"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/**
 * No messages empty state
 */
export function NoMessagesState() {
  return (
    <EmptyState
      title="No messages yet"
      description="Start a conversation by sending a message"
      icon="💬"
    />
  );
}

/**
 * No jobs empty state
 */
export function NoJobsState() {
  return (
    <EmptyState
      title="No jobs available"
      description="Check back soon for new opportunities"
      icon="🔍"
    />
  );
}

/**
 * No threads empty state
 */
export function NoThreadsState() {
  return (
    <EmptyState
      title="No conversations yet"
      description="Browse jobs or wait for inquiries to start chatting"
      icon="👋"
    />
  );
}

/**
 * Error state
 */
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">❌</div>
      <h3 className="empty-state-title-title var(--danger)">Error</h3>
      <p className="text-var-muted text-center mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 var(--primary) hover:var(--primary-dark) var(--primary-fg) rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
