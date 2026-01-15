import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, Heart, User } from 'lucide-react';
import Sidebar from './Sidebar';
import { useToast } from './ui/use-toast';
import { useEffect } from 'react';
import Notifications from './Notifications';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (socket) {
      socket.on('newBloodRequest', (data) => {
        toast({
          title: "Urgent Blood Request",
          description: `${data.hospital?.profile?.name || 'A Hospital'} needs ${data.quantity} units of ${data.bloodGroup} (Urgency: ${data.urgency})`,
          variant: "destructive",
          duration: 10000,
        });
      });

      return () => {
        socket.off('newBloodRequest');
      };
    }
  }, [socket, toast]);

  const roleLabels = {
    admin: 'Admin',
    bloodbank: 'Blood Bank',
    hospital: 'Hospital',
    donor: 'Donor',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b h-[65px] flex items-center bg-card z-10 sticky top-0">
        <div className="container mx-auto px-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Blood Link</span>
            <span className="hidden md:inline-flex text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {roleLabels[user?.role] || 'User'} Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Notifications />
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="hidden md:inline-block font-medium">{user?.profile?.name || user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 bg-muted/10">
          <div className="container mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
