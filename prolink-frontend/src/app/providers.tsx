'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import SmoothScrollProvider from '../components/SmoothScrollProvider';
import { UserProvider } from '../context/UserContext';
import { SocketProvider } from '../lib/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <SocketProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: { borderRadius: 'var(--radius)' },
              duration: 4000,
            }}
          />
        </SocketProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
