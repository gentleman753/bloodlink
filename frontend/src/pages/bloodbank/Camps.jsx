import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Calendar, Plus } from 'lucide-react';

export default function BloodBankCamps() {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCampOpen, setNewCampOpen] = useState(false);
  const { toast } = useToast();

  const [campForm, setCampForm] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    targetDonors: '',
  });

  useEffect(() => {
    fetchCamps();
    const interval = setInterval(fetchCamps, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCamps = async () => {
    try {
      const res = await api.get('/camps');
      setCamps(res.data.data.camps);
    } catch (error) {
      console.error('Error fetching camps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/camps', {
        ...campForm,
        location: {
          address: campForm.address,
          city: campForm.city,
          state: campForm.state,
          zipCode: campForm.zipCode,
        },
      });
      toast({ title: 'Success', description: 'Camp created successfully' });
      setNewCampOpen(false);
      setCampForm({
        name: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        targetDonors: '',
      });
      fetchCamps();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create camp',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Donation Camps</h1>
          <p className="text-muted-foreground">Manage your donation camps</p>
        </div>
        <Dialog open={newCampOpen} onOpenChange={setNewCampOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Camp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Donation Camp</DialogTitle>
              <DialogDescription>Organize a new blood donation camp</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCamp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Camp Name *</Label>
                  <Input value={campForm.name} onChange={(e) => setCampForm((prev) => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={campForm.date} onChange={(e) => setCampForm((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={campForm.description} onChange={(e) => setCampForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input type="time" value={campForm.startTime} onChange={(e) => setCampForm((prev) => ({ ...prev, startTime: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input type="time" value={campForm.endTime} onChange={(e) => setCampForm((prev) => ({ ...prev, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={campForm.address} onChange={(e) => setCampForm((prev) => ({ ...prev, address: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input value={campForm.city} onChange={(e) => setCampForm((prev) => ({ ...prev, city: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input value={campForm.state} onChange={(e) => setCampForm((prev) => ({ ...prev, state: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input value={campForm.zipCode} onChange={(e) => setCampForm((prev) => ({ ...prev, zipCode: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Camp</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {camps.map((camp) => (
                <TableRow key={camp._id}>
                  <TableCell>{camp.name}</TableCell>
                  <TableCell>{new Date(camp.date).toLocaleDateString()}</TableCell>
                  <TableCell>{camp.location.city}, {camp.location.state}</TableCell>
                  <TableCell>{camp.registeredDonors?.length || 0}</TableCell>
                  <TableCell>
                    <Badge variant={camp.isActive ? 'success' : 'default'}>
                      {camp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
