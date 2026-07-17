import { io, Socket } from 'socket.io-client';
import ENV from './config';
import { tokenStorage } from './secureStore';

let socket: Socket | null = null;

export async function initializeSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await tokenStorage.getToken();

  socket = io(ENV.SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export async function updateSocketAuth(): Promise<void> {
  if (socket) {
    const token = await tokenStorage.getToken();
    socket.auth = { token };
    socket.disconnect();
    socket.connect();
  }
}
