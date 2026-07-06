import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

export default function ChatWindow({ conversationId, currentUser, receiverId }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    // 1. Fetch historical messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) setMessages(data)
    }

    fetchMessages()

    // 2. Subscribe to Realtime changes for seamless updates
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only add the message if we didn't just send it (prevents duplicates)
          setMessages((current) => {
            const exists = current.find((msg) => msg.id === payload.new.id)
            if (exists) return current
            return [...current, payload.new]
          })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageData = {
      content: newMessage,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      conversation_id: conversationId,
    }

    // Optimistic Update: Show message immediately in the UI
    const tempId = crypto.randomUUID()
    setMessages((prev) => [...prev, { ...messageData, id: tempId, created_at: new Date().toISOString() }])
    setNewMessage('')

    // Send to Supabase
    const { error } = await supabase.from('messages').insert([messageData])
    if (error) {
      console.error('Error sending message:', error)
      // Ideally, remove the optimistic message here if it fails
    }
  }

  return (
    <Card className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <h3 className="chat-window-header-name">Secure Messaging</h3>
        <span className="chat-window-status">
          Connection Live
        </span>
      </div>
      
      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 var(--bg2)" ref={scrollRef}>
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                    isMe
                      ? 'var(--primary) var(--primary-fg) rounded-2xl rounded-tr-sm'
                      : 'bg-slate-100 var(--fg) rounded-2xl rounded-tl-sm border var(--border)'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })}
          </div>
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="chat-window-input-wrap">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-window-input"
        />
        <Button type="submit" className="chat-window-send-btn">
          <Send className="chat-window-spinner" />
          Send
        </Button>
      </form>
    </Card>
  )
}