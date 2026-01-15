import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { Inbox, CheckCircle, XCircle } from 'lucide-react';

export default function BloodBankRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const socket = useSocket();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new requests
    socket.on('newBloodRequest', (newRequest) => {
      // Check if it's strictly a new request we should see (e.g. sent to us)
      // The socket room logic handles the targeting, so we just add it.
      // But we should check if it's already there (e.g. from initial fetch)
      setRequests((prev) => {
        if (prev.some(req => req._id === newRequest._id)) return prev;
        return [newRequest, ...prev];
      });

      if (newRequest.notificationType === 'personal') {
         toast({
          title: 'New Blood Request',
          description: `${newRequest.hospital?.profile?.name} requested ${newRequest.quantity} units of ${newRequest.bloodGroup}`,
        });
      }
    });

    // Listen for updates
    socket.on('requestUpdated', (updatedRequest) => {
      setRequests((prev) => 
        prev.map((req) => 
          req._id === updatedRequest._id ? updatedRequest : req
        )
      );
    });

    return () => {
      socket.off('newBloodRequest');
      socket.off('requestUpdated');
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await api.patch(`/requests/${id}/approve`);
      toast({ title: 'Success', description: 'Request approved and blood issued' });
      fetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.patch(`/requests/${id}/reject`);
      toast({ title: 'Success', description: 'Request rejected' });
      fetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Blood Requests
          </CardTitle>
          <CardDescription>Respond to blood requests from hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req._id}>
                  <TableCell>{req.hospital?.profile?.name}</TableCell>
                  <TableCell>{req.bloodGroup}</TableCell>
                  <TableCell>{req.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={req.urgency === 'critical' ? 'destructive' : req.urgency === 'high' ? 'warning' : 'default'}>
                      {req.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'destructive' : 'default'}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveRequest(req._id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(req._id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
