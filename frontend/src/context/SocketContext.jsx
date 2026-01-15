import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Connect to the root URL (assuming backend is running on same host/port or proxied)
    // For development, VITE_API_URL is http://localhost:5000/api
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove /api from the end to get the root URL
    const socketUrl = apiUrl.replace(/\/api$/, '');
    
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      // Join personal room (by User ID)
      console.log('Joining personal room:', user._id);
      socket.emit('join', user._id);

      // Join role-based rooms
      if (user.role === 'admin') {
        console.log('Joining admins room');
        socket.emit('join', 'admins');
      } else if (user.role === 'bloodbank') {
        console.log('Joining bloodbanks room');
        socket.emit('join', 'bloodbanks'); 
      } else if (user.role === 'donor') {
        // Join city-based donor room
        if (user.profile?.address?.city) {
          const roomName = `donors_${user.profile.address.city.toLowerCase()}`;
          socket.emit('join', roomName);
        }
      }
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
