import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import { font, space, radius, shadow } from '@/theme/tokens';
import { Avatar } from '@/components/ui/DesignSystem';
import { formatTime, getInitials } from '@/utils/formatters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  sent_at: string;
}

export default function ChatThreadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { on } = useSocket();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);

  const threadId = Number(id);

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      const res = await api.get(`/chats/${threadId}/messages`, {
        params: { page: 1, limit: 50 },
      });
      return res.data.data as Message[];
    },
    enabled: Boolean(threadId),
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/chats/${threadId}/messages`, {
        content,
        message_type: 'text',
      });
      return res.data.data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat-threads'] });
    },
  });

  // Listen for real-time messages
  useEffect(() => {
    const cleanup = on('new_message', (msg: unknown) => {
      const message = msg as { thread_id: number };
      if (message.thread_id === threadId) {
        queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      }
    });

    const cleanupTyping = on('typing', (data: unknown) => {
      const typingData = data as { thread_id: number; is_typing: boolean };
      if (typingData.thread_id === threadId) {
        setTyping(typingData.is_typing);
      }
    });

    return () => {
      cleanup();
      cleanupTyping();
    };
  }, [on, threadId, queryClient]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage.mutate(text);
    setInputText('');
  }, [inputText, sendMessage]);

  const messages = messagesData ?? [];
  // FlatList inverted expects data in reverse chronological order
  const reversedMessages = [...messages].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Custom Header ──────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={t.text2} />
        </TouchableOpacity>

        <Avatar uri={undefined} initials="U" size={36} />

        <View style={styles.headerInfo}>
          <Text style={[font.headingS, { color: t.text }]} numberOfLines={1}>
            Chat
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: t.green }]} />
            <Text style={[font.monoS, { color: t.text3 }]}>online</Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Messages ───────────────────────────── */}
      {isLoading ? (
        <LoadingSpinner color={t.rust} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user?.id;
            return (
              <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
                <View
                  style={[
                    styles.bubble,
                    isMine
                      ? [styles.bubbleMine, { backgroundColor: t.rust }]
                      : [styles.bubbleTheirs, { backgroundColor: t.surface2, borderColor: t.border }],
                  ]}
                >
                  <Text
                    style={[
                      font.bodyM,
                      { lineHeight: 20 },
                      isMine ? { color: '#fff' } : { color: t.text },
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
                <Text
                  style={[
                    font.monoS,
                    { color: t.text3, marginTop: 2, marginBottom: 2 },
                    isMine ? { marginRight: 4, textAlign: 'right' } : { marginLeft: 4 },
                  ]}
                >
                  {formatTime(item.sent_at)}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={styles.messageList}
          inverted
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* ── Typing Indicator ───────────────────── */}
      {typing && (
        <View style={styles.typingContainer}>
          <Text style={[font.bodyS, { color: t.text3, fontStyle: 'italic' }]}>Typing...</Text>
        </View>
      )}

      {/* ── Input Bar ──────────────────────────── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8, backgroundColor: t.bg, borderTopColor: t.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: t.surface2, color: t.text }]}
          placeholder="Type a message..."
          placeholderTextColor={t.text3}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? t.rust : t.surface3 },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessage.isPending}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginLeft: space.sm,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageList: {
    paddingVertical: space.sm,
    flexGrow: 1,
  },
  bubbleRow: {
    marginVertical: 3,
    paddingHorizontal: space.lg,
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  bubbleRowTheirs: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMine: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  typingContainer: {
    paddingHorizontal: space.xl,
    paddingVertical: space.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: radius.full,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: space.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
