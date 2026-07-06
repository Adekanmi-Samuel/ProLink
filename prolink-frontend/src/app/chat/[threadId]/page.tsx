'use client';

// NOTE: This file is intentionally loosely typed for faster UI iteration.
// If you want strict typing, we should add explicit message/thread interfaces.
// @ts-nocheck

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import api from '../../../lib/api';
import { SOCKET_URL } from '../../../lib/backendConfig';
import imageCompression from 'browser-image-compression';
import ReportBlockMenu from '../../../components/ReportBlockMenu';

function formatTime(dateStr: any) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(dateStr: any) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const COLORS = ['#00D68F', '#4A8CFF', '#E8633C', '#F0B429', '#A78BFA', '#F472B6'];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || 'A').length; i++) hash = (name || 'A').charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ChatPage() {
  const { threadId } = useParams();
  const router = useRouter();
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const currentUserIdRef = useRef<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const getUserId = (u: any) => {
    if (!u) return null;
    const id = u?.id ?? u?.user?.id ?? u?.user_id;
    if (id === undefined || id === null) return null;
    const n = typeof id === 'string' ? Number(id) : id;
    return Number.isFinite(n) ? n : null;
  };

  const getMessageSenderId = (m: any) => {
    const id = m?.sender_id;
    if (id === undefined || id === null) return null;
    const n = typeof id === 'string' ? Number(id) : id;
    return Number.isFinite(n) ? n : null;
  };

  const [threadDetails, setThreadDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<any>(null);
  const [pendingAttachment, setPendingAttachment] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  useEffect(() => {
    currentUserIdRef.current = getUserId(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('prolink_token')
      : null;
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    const fetchData = async () => {
      try {
        const [userRes, detailsRes, messagesRes] = await Promise.all([
          api.get('/profiles/me'),
          api.get(`/chats/${threadId}/details`),
          api.get(`/chats/${threadId}/messages`),
        ]);
        setCurrentUser(userRes.data);
        setThreadDetails(detailsRes.data.data);
        setMessages(messagesRes.data.data);
        setNextCursor(messagesRes.data.pagination?.nextCursor);
        setHasMore(messagesRes.data.pagination?.hasMore);

        if (socket && threadId) {
          socket.emit('mark_read', { threadId });
        }
      } catch (error) {
        console.error('Error fetching chat data', error);
        setConnectionError('Could not load this conversation.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (threadId) socket.emit('join_thread', { threadId });

    socket.on('new_message', (message: any) => {
      setMessages((prev) => [...prev, message]);
      setOtherUserTyping(false);
      if (message.sender_id !== currentUserIdRef.current) {
        socket.emit('mark_read', { threadId });
      }
    });

    socket.on('messages_read', (data: any) => {
      if (data.readByUserId !== currentUserIdRef.current) {
        setMessages((prev) => prev.map(m =>
          (m.sender_id === currentUserIdRef.current && !m.read_at)
            ? { ...m, read_at: data.readAt }
            : m
        ));
      }
    });

    socket.on('user_typing', (data: any) => {
      if (data.userId !== currentUserIdRef.current) setOtherUserTyping(true);
    });
    socket.on('user_stopped_typing', (data: any) => {
      if (data.userId !== currentUserIdRef.current) setOtherUserTyping(false);
    });
    socket.on('error', (err: any) => setConnectionError(err?.message || 'Something went wrong.'));
    socket.on('connect_error', () => setConnectionError('Connection lost. Trying to reconnect…'));
    socket.on('connect', () => setConnectionError(''));

    return () => {
      socket.disconnect();
    };
  }, [threadId, router]);

  const loadOlderMessages = async () => {
    if (!hasMore || loadingOlder || !nextCursor) return;
    setLoadingOlder(true);
    try {
      const res = await api.get(`/chats/${threadId}/messages?cursor=${nextCursor}`);
      const olderMessages = res.data.data;
      setMessages((prev) => [...olderMessages, ...prev]);
      setNextCursor(res.data.pagination?.nextCursor);
      setHasMore(res.data.pagination?.hasMore);
    } catch (err) {
      console.error('Failed to load older messages', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (!socketRef.current || !threadId) return;
    socketRef.current.emit('typing_indicator', { threadId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing_indicator', { threadId, isTyping: false });
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if ((!trimmed && !pendingAttachment) || !currentUser || !threadId || !socketRef.current) return;

    setSending(true);

    if (pendingAttachment) {
      setUploadingFile(pendingAttachment);
      try {
        const uploadData = new FormData();
        uploadData.append('file', pendingAttachment);

        const response = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fileUrl = response.data.url;
        const isImage = pendingAttachment.type.startsWith('image/');
        const isVideo = pendingAttachment.type.startsWith('video/');
        let messageType = 'document';
        if (isImage) messageType = 'image';
        else if (isVideo) messageType = 'video';

        socketRef.current.emit('send_message', {
          threadId,
          content: JSON.stringify({ url: fileUrl, name: pendingAttachment.name, caption: trimmed }),
          message_type: messageType,
        });
      } catch (err) {
        console.error('File upload failed', err);
        alert('Failed to upload file. Please try again.');
      } finally {
        setUploadingFile(null);
        setPendingAttachment(null);
      }
    } else {
      socketRef.current.emit('send_message', {
        threadId,
        content: trimmed,
        message_type: 'text',
      });
    }

    socketRef.current.emit('typing_indicator', { threadId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setNewMessage('');
    setSending(false);
  };

  const handleFileClick = () => {
    const fileInput = document.getElementById('chatImageUpload');
    if (fileInput) fileInput.click();
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const renamed = new File([compressed], file.name, { type: compressed.type });
        setPendingAttachment(renamed);
      } catch (err) {
        console.error('Image compression failed, sending original:', err);
        setPendingAttachment(file);
      }
    } else {
      setPendingAttachment(file);
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="spinner" />
          </motion.div>
        </div>
      </div>
    );
  }

  let lastDate: string | null = null;

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg)' }}>
      <div
        className="card-elevated"
        style={{
          width: '100%', maxWidth: 720,
          display: 'flex', flexDirection: 'column',
          height: '100vh', borderRadius: 0, border: 'none',
          position: 'relative',
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1rem', background: 'var(--surface)',
            borderBottom: '1px solid var(--border)', flexShrink: 0, zIndex: 10,
          }}
        >
          <Link
            href="/dashboard/messages"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '1.2rem', padding: '0.3rem 0.4rem' }}
          >
            ←
          </Link>
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'var(--text-sm)',
              background: `${avatarColor(threadDetails?.other_user_name)}20`,
              color: avatarColor(threadDetails?.other_user_name),
              flexShrink: 0,
            }}
          >
            {(threadDetails?.other_user_name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0, marginLeft: '0.4rem' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', lineHeight: '1.2' }}>
              {threadDetails?.other_user_name || 'Conversation'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginTop: '0.1rem' }}>
              {otherUserTyping ? (
                <span style={{ color: 'var(--accent)' }}>typing...</span>
              ) : (
                <>Re: {threadDetails?.job_title || '—'}</>
              )}
            </div>
          </div>
          {threadDetails?.other_user_id && (
            <ReportBlockMenu userId={threadDetails.other_user_id} />
          )}
        </div>

        {/* ── CONNECTION ERROR ── */}
        <AnimatePresence>
          {connectionError && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--danger)', fontSize: 'var(--text-xs)', padding: '0.5rem 1rem', textAlign: 'center',
              }}
            >
              ⚠️ {connectionError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MESSAGES ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
          {hasMore && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button
                onClick={loadOlderMessages}
                disabled={loadingOlder}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 'var(--text-xs)', borderRadius: 999, border: '1px solid var(--border)', padding: '0.3rem 1rem' }}
              >
                {loadingOlder ? 'Loading...' : 'Load previous messages'}
              </button>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const msgDate = new Date(msg.sent_at).toDateString();
              const showDivider = msgDate !== lastDate;
              lastDate = msgDate;

              const isMine = getMessageSenderId(msg) === getUserId(currentUser);

              return (
                <motion.div
                  key={msg.id ?? idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Date divider */}
                  {showDivider && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0.8rem 0' }}>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
                          background: 'var(--surface)', padding: '0.3rem 0.8rem',
                          borderRadius: 8, border: '1px solid var(--border)',
                        }}
                      >
                        {formatDateDivider(msg.sent_at)}
                      </span>
                    </div>
                  )}

                  {/* Bubble row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    width: '100%', marginBottom: '3px',
                  }}>
                    <motion.div
                      style={{
                        maxWidth: '80%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 16,
                        borderTopRightRadius: isMine ? 4 : 16,
                        borderTopLeftRadius: isMine ? 16 : 4,
                        background: isMine ? 'linear-gradient(135deg, var(--accent-dark, #009466), var(--accent))' : 'var(--surface)',
                        color: isMine ? '#fff' : 'var(--fg)',
                        border: isMine ? 'none' : '1px solid var(--border)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        position: 'relative',
                      }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.12 }}
                    >
                      {/* Content */}
                      {msg.message_type === 'image' ? (
                        (() => {
                          try {
                            const data = JSON.parse(msg.content);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <a href={data.url} target="_blank" rel="noreferrer">
                                  <img src={data.url} alt="Attachment" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} />
                                </a>
                                {data.caption && <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4, wordBreak: 'break-word' }}>{data.caption}</span>}
                              </div>
                            );
                          } catch (e) {
                            return <a href={msg.content} target="_blank" rel="noreferrer"><img src={msg.content} alt="Attachment" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} /></a>;
                          }
                        })()
                      ) : msg.message_type === 'video' ? (
                        (() => {
                          try {
                            const data = JSON.parse(msg.content);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <video controls style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} preload="metadata">
                                  <source src={data.url} />
                                </video>
                                {data.caption && <span style={{ fontSize: 'var(--text-sm)', wordBreak: 'break-word' }}>{data.caption}</span>}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <video controls style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} preload="metadata">
                                <source src={msg.content} />
                              </video>
                            );
                          }
                        })()
                      ) : msg.message_type === 'document' ? (
                        (() => {
                          try {
                            const docData = JSON.parse(msg.content);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <a href={docData.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem', background: isMine ? 'rgba(255,255,255,0.12)' : 'var(--accent-alpha)', borderRadius: 8, color: isMine ? '#fff' : 'var(--accent)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                                  📄 {docData.name}
                                </a>
                                {docData.caption && <span style={{ fontSize: 'var(--text-sm)', wordBreak: 'break-word' }}>{docData.caption}</span>}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <a href={msg.content} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem', background: isMine ? 'rgba(255,255,255,0.12)' : 'var(--accent-alpha)', borderRadius: 8, color: isMine ? '#fff' : 'var(--accent)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                                📄 Download Document
                              </a>
                            );
                          }
                        })()
                      ) : msg.message_type === 'action' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontSize: 'var(--text-sm)' }}>{JSON.parse(msg.content).text || 'System Action'}</span>
                          <button onClick={() => alert('Action clicked!')} style={{ padding: '0.3rem 0.7rem', borderRadius: 20, border: 'none', background: isMine ? 'rgba(255,255,255,0.2)' : 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                            {JSON.parse(msg.content).label || 'View'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4, marginRight: '1rem', wordBreak: 'break-word' }}>{msg.content}</span>
                      )}

                      {/* Meta row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem', marginTop: '-0.15rem', alignSelf: 'flex-end' }}>
                        <span style={{ fontSize: '0.6rem', color: isMine ? 'rgba(255,255,255,0.55)' : 'var(--fg-tertiary)' }}>
                          {formatTime(msg.sent_at)}
                        </span>
                        {isMine && (
                          <span style={{ fontSize: '0.7rem', color: (msg.read_at || msg.read) ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {otherUserTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '3px' }}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 16, borderTopLeftRadius: 4,
                  padding: '0.5rem 0.75rem', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-tertiary)', display: 'inline-block' }}
                      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Uploading banner */}
          <AnimatePresence>
            {uploadingFile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, alignSelf: 'center', margin: '0.5rem auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: 'fit-content' }}
              >
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Uploading {uploadingFile.name}...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending attachment banner */}
          {pendingAttachment && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, alignSelf: 'flex-start', margin: '0.5rem 0', minWidth: 200 }}>
              <span style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📎 {pendingAttachment.name}
              </span>
              <button type="button" onClick={() => setPendingAttachment(null)} className="btn btn-ghost btn-sm" style={{ padding: '0 0.5rem', fontSize: 'var(--text-md)' }}>
                ✕
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT ── */}
        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'flex', alignItems: 'flex-end', gap: '0.5rem',
            padding: '0.6rem 1rem', background: 'var(--bg)',
            borderTop: '1px solid var(--border)', flexShrink: 0,
          }}
        >
          <input type="file" id="chatImageUpload" accept="*" style={{ display: 'none' }} onChange={handleFileUpload} />
          <button type="button" onClick={handleFileClick} className="btn btn-ghost btn-sm" style={{ fontSize: '1.3rem', padding: '0 0.4rem' }}>
            📎
          </button>
          <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 999, border: '1.5px solid var(--border)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', minHeight: 44 }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', color: 'var(--fg)' }}
              placeholder="Type a message"
            />
          </div>
          <motion.button
            type="submit"
            disabled={(!newMessage.trim() && !pendingAttachment) || sending}
            className="btn btn-accent"
            style={{
              width: 44, height: 44, borderRadius: '50%', padding: 0, fontSize: '1.2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabledStyle={{ opacity: 0.35 }}
          >
            ➤
          </motion.button>
        </form>
      </div>
    </div>
  );
}
