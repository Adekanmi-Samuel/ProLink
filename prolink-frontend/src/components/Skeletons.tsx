'use client';

/**
 * Generic skeleton loader - animated placeholder
 */
export function Skeleton({ 
  className = '',
  style,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="skeleton"
      style={style}
      {...props}
    />
  );
}

/**
 * Chat message skeleton loader
 */
export function ChatMessageSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0' }}>
      <Skeleton style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton style={{ height: 14, width: '40%' }} />
        <Skeleton style={{ height: 48, width: '100%' }} />
      </div>
    </div>
  );
}

/**
 * Job card skeleton loader
 */
export function JobCardSkeleton() {
  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <Skeleton style={{ height: 22, width: '60%', marginBottom: '0.75rem' }} />
      <Skeleton style={{ height: 14, width: '90%', marginBottom: '0.5rem' }} />
      <Skeleton style={{ height: 14, width: '66%', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Skeleton style={{ height: 32, flex: 1 }} />
        <Skeleton style={{ height: 32, flex: 1 }} />
      </div>
    </div>
  );
}

/**
 * Thread list skeleton loader
 */
export function ThreadListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton style={{ height: 16, width: '50%' }} />
          <Skeleton style={{ height: 14, width: '100%' }} />
          <Skeleton style={{ height: 14, width: '75%' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Profile card skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <Skeleton style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton style={{ height: 28, width: '40%' }} />
          <Skeleton style={{ height: 14, width: '50%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton style={{ height: 14, width: '100%' }} />
        <Skeleton style={{ height: 14, width: '100%' }} />
        <Skeleton style={{ height: 14, width: '66%' }} />
      </div>
    </div>
  );
}
