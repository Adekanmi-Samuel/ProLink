import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUnreadMessageCount = useUIStore((s) => s.setUnreadMessageCount);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    (async () => {
      try {
        const sock = await initializeSocket();
        if (!mounted) return;
        socketRef.current = sock;

        sock.on('new_message', (message: { thread_id: number; sender_id: number }) => {
          // Could update thread list or show notification
          console.log('[Socket] New message in thread:', message.thread_id);
        });

        sock.on('unread_count', (data: { count: number }) => {
          setUnreadMessageCount(data.count);
        });

        sock.on('notification', (notification: { type: string; content: string }) => {
          console.log('[Socket] Notification:', notification.content);
        });
      } catch (err) {
        console.warn('[Socket] Failed to initialize:', err);
      }
    })();

    return () => {
      mounted = false;
      disconnectSocket();
      socketRef.current = null;
    };
  }, [isAuthenticated, setUnreadMessageCount]);

  const sendMessage = useCallback(
    (event: string, data: unknown) => {
      const sock = getSocket();
      if (sock?.connected) {
        sock.emit(event, data);
      }
    },
    []
  );

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      const sock = getSocket();
      sock?.on(event, handler);
      return () => {
        sock?.off(event, handler);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    sendMessage,
    on,
  };
}

export default useSocket;
