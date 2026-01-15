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
import { Send, Loader2 } from 'lucide-react';
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

      // Add to local list immediately (socket emits to recipient only usually, 
      // but sender needs to see it too. Our API returns the message)
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

  if (!recipient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            Chat with {recipient.profile?.name || recipient.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.sender === user._id || msg.sender?._id === user._id;
              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-[10px] opacity-70 block mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
