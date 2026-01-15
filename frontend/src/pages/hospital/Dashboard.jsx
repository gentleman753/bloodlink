import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import ChatDialog from '../../components/ChatDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Search, Plus, Package, MapPin, MessageSquare } from 'lucide-react';

export default function HospitalDashboard() {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const { toast } = useToast();
  const socket = useSocket();

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);

  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: '',
    city: '',
    state: '',
  });

  const [requestForm, setRequestForm] = useState({
    bloodBank: '',
    bloodGroup: '',
    quantity: '',
    urgency: 'medium',
    patientName: '',
    patientAge: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('requestUpdated', (updatedRequest) => {
      setRequests((prev) => 
        prev.map((req) => 
          req._id === updatedRequest._id ? updatedRequest : req
        )
      );
      
      toast({
        title: 'Request Updated',
        description: `Request for ${updatedRequest.quantity} units of ${updatedRequest.bloodGroup} is now ${updatedRequest.status}`,
      });
    });

    return () => {
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

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.bloodGroup && searchFilters.bloodGroup !== 'ALL') {
        params.append('bloodGroup', searchFilters.bloodGroup);
      }
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.state) params.append('state', searchFilters.state);

      const res = await api.get(`/requests/search/bloodbanks?${params.toString()}`);
      setBloodBanks(res.data.data.bloodBanks);
      setSearchOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to search blood banks',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', requestForm);
      toast({ title: 'Success', description: 'Blood request created successfully' });
      setRequestOpen(false);
      setRequestForm({
        bloodBank: '',
        bloodGroup: '',
        quantity: '',
        urgency: 'medium',
        patientName: '',
        patientAge: '',
        reason: '',
        notes: '',
      });
      fetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create request',
        variant: 'destructive',
      });
    }
  };

  const loadBloodBanksForRequest = async () => {
    try {
      const res = await api.get('/requests/search/bloodbanks');
      setBloodBanks(res.data.data.bloodBanks);
      setRequestOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blood banks',
        variant: 'destructive',
      });
    }
  };

  const handleInitiateRequest = (bloodBankId) => {
    setRequestForm((prev) => ({ ...prev, bloodBank: bloodBankId }));
    setRequestOpen(true);
  };

  const handleFulfill = async (id) => {
    try {
      await api.patch(`/requests/${id}/fulfill`);
      toast({ title: 'Success', description: 'Request marked as fulfilled' });
      fetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark as fulfilled',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChat = (recipient, requestId) => {
    setChatRecipient(recipient);
    setActiveRequestId(requestId);
    setChatOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
          <p className="text-muted-foreground">Search blood banks and manage blood requests</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search Blood Banks
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Search Blood Banks</DialogTitle>
                <DialogDescription>Find blood banks by location and blood group</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select value={searchFilters.bloodGroup} onValueChange={(value) => setSearchFilters((prev) => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={searchFilters.city} onChange={(e) => setSearchFilters((prev) => ({ ...prev, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={searchFilters.state} onChange={(e) => setSearchFilters((prev) => ({ ...prev, state: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSearch}>Search</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
            <DialogTrigger asChild>
              <Button onClick={loadBloodBanksForRequest}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Blood Request</DialogTitle>
                <DialogDescription>Request blood from a verified blood bank</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Blood Bank *</Label>
                  <Select value={requestForm.bloodBank} onValueChange={(value) => setRequestForm((prev) => ({ ...prev, bloodBank: value }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodBanks.length > 0 ? (
                        bloodBanks.map((bb) => (
                          <SelectItem key={bb._id} value={bb._id}>
                            {bb.profile?.name} - {bb.profile?.address?.city}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_results" disabled>No blood banks available. Please search first.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Group *</Label>
                    <Select value={requestForm.bloodGroup} onValueChange={(value) => setRequestForm((prev) => ({ ...prev, bloodGroup: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input type="number" min="1" value={requestForm.quantity} onChange={(e) => setRequestForm((prev) => ({ ...prev, quantity: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={requestForm.urgency} onValueChange={(value) => setRequestForm((prev) => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient Name</Label>
                    <Input value={requestForm.patientName} onChange={(e) => setRequestForm((prev) => ({ ...prev, patientName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Age</Label>
                    <Input type="number" value={requestForm.patientAge} onChange={(e) => setRequestForm((prev) => ({ ...prev, patientAge: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input value={requestForm.reason} onChange={(e) => setRequestForm((prev) => ({ ...prev, reason: e.target.value }))} />
                </div>
                <DialogFooter>
                  <Button type="submit">Create Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Results */}
      {bloodBanks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Blood Banks</CardTitle>
            <CardDescription>Blood banks matching your search criteria</CardDescription>
          </CardHeader>
          <CardContent>
            {bloodBanks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No blood banks found. Try adjusting your search criteria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bloodBanks.map((bb) => (
                  <Card key={bb._id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{bb.profile?.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {bb.profile?.address?.city}, {bb.profile?.address?.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Available Blood Groups:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(bb.inventory || {}).length > 0 ? (
                            Object.entries(bb.inventory || {}).map(([bg, qty]) => (
                              <Badge key={bg} variant="outline">
                                {bg}: {qty} units
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No inventory data available</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button className="w-full" onClick={() => handleInitiateRequest(bb._id)}>
                          Request Blood
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Blood Requests
          </CardTitle>
          <CardDescription>Track the status of your blood requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Bank</TableHead>
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
                  <TableCell>{req.bloodBank?.profile?.name}</TableCell>
                  <TableCell>{req.bloodGroup}</TableCell>
                  <TableCell>{req.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={req.urgency === 'critical' ? 'destructive' : req.urgency === 'high' ? 'warning' : 'default'}>
                      {req.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'destructive' : req.status === 'fulfilled' ? 'default' : 'warning'}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {req.status === 'approved' && (
                        <Button size="sm" onClick={() => handleFulfill(req._id)}>
                          Mark Fulfilled
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleOpenChat(req.bloodBank, req._id)}
                        title="Chat with Blood Bank"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ChatDialog 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
        recipient={chatRecipient}
        relatedRequestId={activeRequestId}
      />
    </div>
  );
}
