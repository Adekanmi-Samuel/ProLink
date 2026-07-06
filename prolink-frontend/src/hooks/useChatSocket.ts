'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/backendConfig';

/**
 * Custom React Hook for WebSocket Chat Integration
 * Manages Socket.IO connection, real-time messaging, and typing indicators
 * Integrates with React Query for optimistic updates
 */
export const useChatSocket = (threadId: number | null) => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [usersTyping, setUsersTyping] = useState<Set<number>>(new Set());

  // Initialize Socket.IO connection
  useEffect(() => {
    // Create socket connection with auth via httpOnly cookie
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection established
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      toast.success('Connected to chat');
    });

    // Connection lost
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      toast.error('Disconnected from chat');
    });

    // Authentication error
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat');
    });

    // Generic error from server
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      toast.error(data?.message || 'An error occurred');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join thread when threadId changes
  useEffect(() => {
    if (!socketRef.current || !threadId || !isConnected) {
      return;
    }

    socketRef.current.emit('join_thread', { threadId });

    // Listen for successful join
    const onJoinedThread = (data: any) => {
      console.log('Joined thread:', data);
    };

    // Listen for incoming messages
    const onNewMessage = (message: any) => {
      console.log('New message received:', message);

      // Update React Query cache with the new message
      queryClient.setQueryData(
        ['messages', threadId],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            messages: Array.isArray(oldData.messages)
              ? [...oldData.messages.filter((m: any) => m.id !== message.id), message]
              : [message],
          };
        }
      );

      // Only show toast if message is from another user
      const currentUserId = (() => {
        try {
          const userStr = localStorage.getItem('user');
          return userStr ? JSON.parse(userStr).id : null;
        } catch {
          return null;
        }
      })();

      if (message.sender_id !== currentUserId) {
        toast.success(`New message from user ${message.sender_id}`);
      }
    };

    // Listen for user joined event
    const onUserJoined = (data: any) => {
      console.log('User joined:', data);
      toast.info('User joined the chat');
    };

    // Listen for user left event
    const onUserLeft = (data: any) => {
      console.log('User left:', data);
    };

    // Listen for typing indicators
    const onUserTyping = (data: any) => {
      setUsersTyping((prev) => new Set([...prev, data.userId]));
    };

    const onUserStoppedTyping = (data: any) => {
      setUsersTyping((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    socketRef.current.on('joined_thread', onJoinedThread);
    socketRef.current.on('new_message', onNewMessage);
    socketRef.current.on('user_joined', onUserJoined);
    socketRef.current.on('user_left', onUserLeft);
    socketRef.current.on('user_typing', onUserTyping);
    socketRef.current.on('user_stopped_typing', onUserStoppedTyping);

    return () => {
      socketRef.current?.off('joined_thread', onJoinedThread);
      socketRef.current?.off('new_message', onNewMessage);
      socketRef.current?.off('user_joined', onUserJoined);
      socketRef.current?.off('user_left', onUserLeft);
      socketRef.current?.off('user_typing', onUserTyping);
      socketRef.current?.off('user_stopped_typing', onUserStoppedTyping);
    };
  }, [threadId, isConnected, queryClient]);

  // Send message function
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !threadId || !isConnected) {
        toast.error('Not connected to chat');
        return;
      }

      if (!content.trim()) {
        toast.error('Message cannot be empty');
        return;
      }

      socketRef.current.emit('send_message', {
        threadId,
        content: content.trim(),
      });
    },
    [threadId, isConnected]
  );

  // Typing indicator functions
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !threadId) {
        return;
      }

      socketRef.current.emit('typing_indicator', {
        threadId,
        isTyping,
      });
    },
    [threadId]
  );

  return {
    isConnected,
    sendMessage,
    setTyping,
    usersTyping: Array.from(usersTyping),
  };
};
