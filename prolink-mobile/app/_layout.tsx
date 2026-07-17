import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { tokenStorage } from '@/lib/secureStore';
import api from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

function RootLayoutNav() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const setToken = useAuthStore((s) => s.setToken);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.getToken();
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        await fetchUser();
      } else {
        useAuthStore.setState({ isLoading: false });
      }
    })();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
