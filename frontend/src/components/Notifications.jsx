import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'; // Assuming shadcn structure
import { useSocket } from '../context/SocketContext';
import api from '../lib/api';
import { Badge } from './ui/badge';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.notifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        // Create a new notification object from the event data
        // For 'newBloodRequest', data is the request object.
        // We might want to construct a temporary notification object if backend doesn't send the full notification doc via socket
        // In my backend implementation, I emitted the REQUEST object, not the NOTIFICATION object.
        // But I also emitted a message in 'broadcast'.
        
        // Let's assume we fetch fresh notifications to be safe and consistent, 
        // OR construct one for immediate UI feedback.
        // Fetching is safer for ID consistency (read status etc).
        fetchNotifications();
      };

      socket.on('newBloodRequest', handleNotification);

      return () => {
        socket.off('newBloodRequest', handleNotification);
      };
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification._id} 
                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="font-medium text-sm mb-1">{notification.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </div>
                <div className="text-[10px] text-muted-foreground mt-2 w-full text-right">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
