'use client';


import { useAuth } from '@/hooks/useAuth';
import TutorialModal from '@/components/TutorialModal';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <>

      <main className="bg-[var(--bg)] min-h-[calc(100vh-4rem)] text-[var(--fg)]">
        {children}
      </main>
      <TutorialModal />
    </>
  );
}
