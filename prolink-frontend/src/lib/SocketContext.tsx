'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from './backendConfig';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // NOTE: This path-based skip is fragile — it relies on hardcoded URL prefixes
    // and will silently break if routes are renamed or new auth pages are added.
    // A more robust approach would be to check auth state (e.g. from a cookie or
    // auth context) before connecting, or to always connect and let the server
    // reject unauthenticated sockets. For now this is kept for backward compat.
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/verify-email') || path.startsWith('/forgot-password') || path.startsWith('/reset-password')) {
        return;
      }
    }

    // Create socket connection - auth is handled by httpOnly cookie (withCredentials)
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.connect();

    socketInstance.on('connect', () => {
      console.log('Global Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Global Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.log('Socket connection error (non-fatal if not logged in):', err.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};