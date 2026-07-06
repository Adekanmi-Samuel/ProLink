'use client';

// NOTE: This file is intentionally loosely typed for faster UI iteration.
// If you want strict typing, we should add explicit message/thread interfaces.
// @ts-nocheck

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import io from 'socket.io-client';
import axios from 'axios';
import api from '../../lib/api';
import { SOCKET_URL } from '../../lib/backendConfig';
import ReportBlockMenu from '../../components/ReportBlockMenu';

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
    // Check for user_id to fix the bug where sender's ID resolves to null
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
    const socket = io(SOCKET_URL, { withCredentials: true });
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
        
        // Notify server that we've read any unread messages from them
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
      
      // If we received a message from the other person while chat is open, mark it as read immediately
      if (message.sender_id !== currentUserIdRef.current) {
        socket.emit('mark_read', { threadId });
      }
    });

    socket.on('messages_read', (data: any) => {
      // Update local state to reflect read messages
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
        uploadData.append('upload_preset', 'y3p7gfda');

        const isImage = pendingAttachment.type.startsWith('image/');
        const endpointType = isImage ? 'image' : 'raw';

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dtv41sa4b/${endpointType}/upload`,
          uploadData
        );
        
        const fileUrl = response.data.secure_url;
        
        socketRef.current.emit('send_message', {
          threadId,
          content: JSON.stringify({ url: fileUrl, name: pendingAttachment.name, caption: trimmed }),
          message_type: isImage ? 'image' : 'document',
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

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAttachment(file);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div className="pl-spinner" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  let lastDate: string | null = null;

  return (
    <div style={s.page}>
      <div style={s.chatWrap}>
        {/* WhatsApp-style Header */}
        <div style={s.header}>
          <Link href="/dashboard/messages" style={s.backBtn}>←</Link>
          <img
            src={threadDetails?.other_user_avatar || '/default-avatar.png'}
            alt={threadDetails?.other_user_name}
            style={s.headerAvatar}
          />
          <div style={{ flex: 1, minWidth: 0, marginLeft: '0.4rem' }}>
            <div style={s.headerName}>{threadDetails?.other_user_name || 'Conversation'}</div>
            <div style={s.headerJob}>
              {otherUserTyping ? 'typing...' : `Re: ${threadDetails?.job_title || '—'}`}
            </div>
          </div>
          {threadDetails?.other_user_id && (
            <ReportBlockMenu userId={threadDetails.other_user_id} />
          )}
        </div>

        {connectionError && <div style={s.errorBanner}>⚠️ {connectionError}</div>}

        {/* Messages */}
        <div style={s.messagesArea}>
          {hasMore && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button 
                onClick={loadOlderMessages} 
                disabled={loadingOlder}
                style={{
                  ...s.dateDividerText, 
                  cursor: 'pointer', 
                  border: 'none',
                  opacity: loadingOlder ? 0.7 : 1
                }}
              >
                {loadingOlder ? 'Loading...' : 'Load previous messages'}
              </button>
            </div>
          )}
          {messages.map((msg, idx) => {
            const msgDate = new Date(msg.sent_at).toDateString();
            const showDivider = msgDate !== lastDate;
            lastDate = msgDate;

            const isMine = getMessageSenderId(msg) === getUserId(currentUser);

            return (
              <div key={msg.id ?? idx}>
                {showDivider && (
                  <div style={s.dateDivider}>
                    <span style={s.dateDividerText}>{formatDateDivider(msg.sent_at)}</span>
                  </div>
                )}
                <div style={isMine ? s.rowMine : s.rowTheirs}>
                  <div style={isMine ? s.bubbleMine : s.bubbleTheirs}>
                    <div style={s.bubbleContent}>
                      {msg.message_type === 'image' ? (
                        (() => {
                          try {
                            const data = JSON.parse(msg.content);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
                                <a href={data.url} target="_blank" rel="noreferrer">
                                  <img src={data.url} alt="Attachment" style={s.imageAttachment} />
                                </a>
                                {data.caption && <span style={s.messageText}>{data.caption}</span>}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <a href={msg.content} target="_blank" rel="noreferrer">
                                <img src={msg.content} alt="Attachment" style={s.imageAttachment} />
                              </a>
                            );
                          }
                        })()
                      ) : msg.message_type === 'document' ? (
                        (() => {
                          try {
                            const docData = JSON.parse(msg.content);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <a href={docData.url} target="_blank" rel="noreferrer" style={s.documentAttachment}>
                                  📄 {docData.name}
                                </a>
                                {docData.caption && <span style={s.messageText}>{docData.caption}</span>}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <a href={msg.content} target="_blank" rel="noreferrer" style={s.documentAttachment}>
                                📄 Download Document
                              </a>
                            );
                          }
                        })()
                      ) : msg.message_type === 'action' ? (
                        <div style={s.actionBubble}>
                          <span style={s.bubbleText}>{JSON.parse(msg.content).text || 'System Action'}</span>
                          <button style={s.actionBtn} onClick={() => alert('Action clicked!')}>
                            {JSON.parse(msg.content).label || 'View'}
                          </button>
                        </div>
                      ) : (
                        <span style={s.bubbleText}>{msg.content}</span>
                      )}
                      <div style={s.metaWrap}>
                        <span style={s.bubbleTime}>{formatTime(msg.sent_at)}</span>
                        {isMine && (
                          <span style={(msg.read_at || msg.read) ? s.seenIndicatorRead : s.seenIndicatorGray}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {otherUserTyping && (
            <div style={s.rowTheirs}>
              <div style={s.bubbleTheirs}>
                <div style={s.typingBubble}>
                  <span className="typing-dot" style={s.typingDot} />
                  <span className="typing-dot" style={{ ...s.typingDot, animationDelay: '0.15s' }} />
                  <span className="typing-dot" style={{ ...s.typingDot, animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {uploadingFile && (
            <div style={s.uploadingBanner}>
              <div style={s.spinner} />
              <span style={s.uploadingText}>Uploading {uploadingFile.name}...</span>
            </div>
          )}

          {pendingAttachment && (
            <div style={s.pendingAttachmentBanner}>
              <span style={{ fontSize: '0.85rem', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📎 {pendingAttachment.name}
              </span>
              <button type="button" onClick={() => setPendingAttachment(null)} style={s.removeAttachmentBtn}>
                ✕
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Professional Input */}
        <form onSubmit={handleSendMessage} style={s.inputContainer}>
          <input 
            type="file" 
            id="chatImageUpload" 
            accept="*" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
          />
          <button type="button" onClick={handleFileClick} style={s.attachBtn} title="Attach File/Image">
            📎
          </button>
          <div style={s.inputWrap}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              style={s.input}
              placeholder="Type a message"
            />
          </div>
          <button type="submit" disabled={(!newMessage.trim() && !pendingAttachment) || sending} style={s.sendBtn}>
            ➤
          </button>
        </form>
      </div>

      <style>{`
        @keyframes typingBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-3px); opacity: 1; } }
        .typing-dot { animation: typingBounce 1s ease-in-out infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loadingWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' },
  page: { minHeight: '100vh', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg)' },
  
  chatWrap: { 
    width: '100%', 
    maxWidth: 720, 
    display: 'flex', 
    flexDirection: 'column' as const, 
    height: '100vh',
    paddingTop: '72px', 
    backgroundColor: 'var(--bg2)', 
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    position: 'relative' as const,
    boxShadow: 'var(--shadow)'
  },
  
  header: { 
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', 
    backgroundColor: 'var(--surface)', 
    borderBottom: '1px solid var(--border)',
    color: 'var(--fg)', flexShrink: 0, zIndex: 10 
  },
  backBtn: { color: 'var(--muted2)', fontSize: '1.4rem', textDecoration: 'none', padding: '0 0.2rem 0 0', display: 'flex', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' as const },
  headerName: { fontWeight: 600, color: 'var(--fg)', fontSize: '1rem', lineHeight: '1.2' },
  headerJob: { color: 'var(--muted2)', fontSize: '0.8rem', fontWeight: 400, marginTop: '0.1rem' },
  
  errorBanner: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.6rem 1rem', fontSize: '0.8rem', textAlign: 'center' as const },
  
  messagesArea: { 
    flex: 1, overflowY: 'auto' as const, padding: '1rem', 
    display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' 
  },
  
  dateDivider: { display: 'flex', justifyContent: 'center', margin: '0.8rem 0' },
  dateDividerText: { 
    fontSize: '0.75rem', color: 'var(--muted2)', backgroundColor: 'var(--surface)', 
    padding: '0.3rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)' 
  },
  
  rowMine: { display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '2px' },
  rowTheirs: { display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '2px' },
  
  bubbleMine: { 
    maxWidth: '80%', background: 'linear-gradient(135deg, var(--accent-dark, #4f46e5), var(--accent))', color: '#fff', 
    padding: '0.45rem 0.6rem', borderRadius: '12px', borderTopRightRadius: '2px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'relative' as const 
  },
  bubbleTheirs: { 
    maxWidth: '80%', backgroundColor: 'var(--surface2)', color: 'var(--fg)', 
    padding: '0.45rem 0.6rem', borderRadius: '12px', borderTopLeftRadius: '2px', 
    border: '1px solid var(--border)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', position: 'relative' as const 
  },
  
  bubbleContent: { display: 'flex', flexDirection: 'column' as const },
  bubbleText: { fontSize: '0.92rem', lineHeight: 1.4, margin: '0 1rem 0.2rem 0', wordBreak: 'break-word' as const },
  messageText: { fontSize: '0.92rem', lineHeight: 1.4, wordBreak: 'break-word' as const },
  
  metaWrap: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem', marginTop: '-0.2rem', alignSelf: 'flex-end' },
  bubbleTime: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' },
  seenIndicatorRead: { fontSize: '0.75rem', color: '#ffffff', marginLeft: '0.1rem' },
  seenIndicatorGray: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.1rem' },
  
  typingBubble: {
    display: 'flex', alignItems: 'center', gap: '4px', height: '20px', padding: '0 0.2rem'
  },
  typingDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block' },
  
  uploadingBanner: {
    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1rem',
    backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    alignSelf: 'center', margin: '0.5rem 0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  spinner: {
    width: 14, height: 14, border: '2px solid var(--muted)', borderTopColor: 'var(--accent)',
    borderRadius: '50%', animation: 'spin 1s linear infinite'
  },
  uploadingText: {
    fontSize: '0.85rem', color: 'var(--fg)', fontWeight: 500
  },
  pendingAttachmentBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem',
    backgroundColor: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '8px',
    alignSelf: 'flex-start', margin: '0.5rem 0', minWidth: '200px'
  },
  removeAttachmentBtn: {
    background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
    fontSize: '1rem', padding: '0 0.5rem'
  },

  inputContainer: { 
    display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '0.6rem 1rem', 
    backgroundColor: 'var(--bg)', flexShrink: 0,
    borderTop: '1px solid var(--border)'
  },
  inputWrap: { 
    flex: 1, backgroundColor: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border2)',
    padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', 
    minHeight: '44px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  input: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.95rem', color: 'var(--fg)' },
  sendBtn: { 
    width: 44, height: 44, borderRadius: '50%', padding: 0, fontSize: '1.2rem', 
    flexShrink: 0, background: 'linear-gradient(135deg, var(--accent-dark, #4f46e5), var(--accent))', color: 'white', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' as const,
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
  },
  attachBtn: {
    background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer',
    color: 'var(--muted2)', padding: '0 0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  imageAttachment: {
    maxWidth: '100%', maxHeight: 200, borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', marginBottom: '0.3rem'
  },
  documentAttachment: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', textDecoration: 'none',
    fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '0.3rem'
  },
  actionBubble: {
    display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center'
  },
  actionBtn: {
    padding: '0.4rem 0.8rem', borderRadius: '20px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
  }
};
