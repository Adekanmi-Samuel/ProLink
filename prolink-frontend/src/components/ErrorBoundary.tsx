'use client';

import React from 'react';
import Button from './ui/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error('ErrorBoundary caught:', error, errorInfo);

    // TODO: Send to Sentry when integrated
    // Sentry.captureException(error, { extra: errorInfo });
  }

  reset() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 mb-6 rounded-full bg-danger/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-danger"
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
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md" style={{ color: 'var(--fg-secondary)' }}>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-3">
            <Button
              variant="accent"
              onClick={() => this.reset()}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for route-level error boundaries
export function RouteErrorBoundary({
  children,
  title = 'Page Error',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
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
            {title}
          </h1>
          <p className="mb-8 max-w-md" style={{ color: 'var(--fg-secondary)' }}>
            We encountered an error while loading this page. Please try again or return to the dashboard.
          </p>
          <div className="flex gap-4">
            <Button
              variant="accent"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = '/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
