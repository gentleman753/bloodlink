import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Inbox, Calendar, Search, Users, Activity, Droplet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '@/lib/api';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (user?.role === 'bloodbank') {
      const fetchCounts = async () => {
        try {
          const res = await api.get('/requests');
          const pending = res.data.data.requests.filter(r => r.status === 'pending').length;
          setPendingRequests(pending);
        } catch (error) {
          console.error('Error fetching request count:', error);
        }
      };
      
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  const links = {
    admin: [
      { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
      // Add more as we split pages
    ],
    bloodbank: [
      { href: '/bloodbank/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/bloodbank/inventory', label: 'Inventory', icon: Droplet },
      { href: '/bloodbank/requests', label: 'Requests', icon: Inbox },
      { href: '/bloodbank/camps', label: 'Donation Camps', icon: Calendar },
    ],
    hospital: [
      { href: '/hospital/dashboard', label: 'Search & Overview', icon: Search },
      // { href: '/hospital/requests', label: 'My Requests', icon: Inbox }, // Currently all in dashboard
    ],
    donor: [
      { href: '/donor/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  };

  const currentRoleLinks = links[user.role] || [];

  return (
    <aside className="w-64 bg-card border-r min-h-[calc(100vh-65px)] p-4 hidden md:block">
      <nav className="space-y-2">
        {currentRoleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{link.label}</span>
              {link.label === 'Requests' && pendingRequests > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequests}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
