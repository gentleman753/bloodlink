import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Loader2, Check, CheckCheck } from 'lucide-react';
import { useToast } from './ui/use-toast';

export default function ChatDialog({ open, onOpenChange, recipient, relatedRequestId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  
  const socket = useSocket();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open && recipient?._id) {
      fetchMessages();
      markAsRead();
    }
  }, [open, recipient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket || !open) return;

    const handleReceiveMessage = (message) => {
      // Check if message is from the current recipient
      if (
        message.sender._id === recipient._id || 
        message.recipient === recipient._id
      ) {
        setMessages((prev) => [...prev, message]);
        // Mark as read immediately if chat is open
        if (message.sender._id === recipient._id) {
            markAsRead();
        }
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, open, recipient]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/history/${recipient._id}`);
      setMessages(res.data.data.messages);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put(`/chat/read/${recipient._id}`);
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await api.post('/chat/send', {
        recipientId: recipient._id,
        content: newMessage,
        relatedRequestId
      });

      // Add to local list immediately
      setMessages((prev) => [...prev, res.data.data.message]);
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (!recipient) return null;

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
              {(recipient.profile?.name || recipient.name || '?')[0].toUpperCase()}
            </div>
            <span>{recipient.profile?.name || recipient.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              <p>No messages yet.</p>
              <p className="text-xs">Start a conversation with {recipient.profile?.name || recipient.name}.</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} className="space-y-3">
                <div className="flex justify-center sticky top-0 z-0">
                  <span className="text-xs bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-muted-foreground border shadow-sm">
                    {date}
                  </span>
                </div>
                {msgs.map((msg, index) => {
                  const isOwn = msg.sender === user._id || msg.sender?._id === user._id;
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-white border text-foreground rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          <span className="text-[10px]">
                            {formatTime(msg.createdAt)}
                          </span>
                          {isOwn && (
                            msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-background mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 rounded-full"
            />
            <Button type="submit" size="icon" rounded="full" className="rounded-full h-10 w-10 shrink-0" disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
