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
    // Only connect if the user has an auth token — skip if on login/signup
    const token = typeof window !== 'undefined' ? localStorage.getItem('prolink_token') : null;
    const hasCookie = typeof window !== 'undefined'
      && document.cookie.split(';').some(c => c.trim().startsWith('token='));

    if (!token && !hasCookie) {
      console.log('Socket: No auth token found, skipping connection');
      return;
    }

    // Create socket connection — auth is handled by httpOnly cookie (withCredentials)
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false, // We'll manage connection manually
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      auth: token ? { token } : undefined,
    });

    // Try connecting — if server rejects, we just get connect_error
    socketInstance.connect();

    socketInstance.on('connect', () => {
      console.log('Global Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Global Socket disconnected');
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
