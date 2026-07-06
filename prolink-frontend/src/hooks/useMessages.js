'use client';

import { useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiService } from '@/lib/apiService';
import { toast } from 'sonner';

/**
 * Hook for optimistic message updates
 * Immediately updates UI, then syncs with server
 */
export const useOptimisticMessage = (threadId: number) => {
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiService.chats.sendMessage(threadId, {
        content,
        message_type: 'text',
      });
    },
    onMutate: async (content) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['messages', threadId],
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', threadId]);

      // Create optimistic message
      const optimisticMessage = {
        id: Date.now(), // Temporary ID
        thread_id: threadId,
        sender_id: -1, // Will be replaced by server response
        content,
        message_type: 'text',
        sent_at: new Date(),
        _optimistic: true, // Mark as optimistic
      };

      // Update cache with optimistic message
      queryClient.setQueryData(['messages', threadId], (old: any) => {
        if (Array.isArray(old)) {
          return [...old, optimisticMessage];
        }
        return old;
      });

      return { previousMessages };
    },
    onError: (error, variables, context: any) => {
      // Revert on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', threadId],
          context.previousMessages
        );
      }
      toast.error('Failed to send message');
    },
    onSuccess: (data) => {
      // Remove optimistic message and add real one
      queryClient.setQueryData(['messages', threadId], (old: any) => {
        if (Array.isArray(old)) {
          // Filter out optimistic messages and add the server response
          return [...old.filter((m: any) => !m._optimistic), data];
        }
        return old;
      });
      toast.success('Message sent');
    },
  });

  return sendMessageMutation;
};

/**
 * Hook to manage pagination and infinite scroll for messages
 */
export const useInfiniteMessages = (threadId: number) => {
  const queryClient = useQueryClient();

  const query = {
    queryKey: ['messages', threadId],
    queryFn: async ({ pageParam = undefined }) => {
      return apiService.chats.getThreadMessages(threadId, {
        limit: 50,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.pagination?.nextCursor,
  };

  return query;
};
