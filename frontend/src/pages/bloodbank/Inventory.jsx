import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus } from 'lucide-react';

export default function BloodBankInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addBloodOpen, setAddBloodOpen] = useState(false);
  const { toast } = useToast();

  const [bloodForm, setBloodForm] = useState({
    bloodGroup: '',
    quantity: '',
    expiryDate: '',
    source: 'donation',
    notes: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlood = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', bloodForm);
      toast({ title: 'Success', description: 'Blood added to inventory' });
      setAddBloodOpen(false);
      setBloodForm({ bloodGroup: '', quantity: '', expiryDate: '', source: 'donation', notes: '' });
      fetchInventory();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add blood',
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
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your blood stock</p>
        </div>
        <Dialog open={addBloodOpen} onOpenChange={setAddBloodOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Blood
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Blood to Inventory</DialogTitle>
              <DialogDescription>Record new blood units received</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBlood} className="space-y-4">
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={bloodForm.bloodGroup} onValueChange={(value) => setBloodForm((prev) => ({ ...prev, bloodGroup: value }))}>
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
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={bloodForm.quantity}
                  onChange={(e) => setBloodForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={bloodForm.expiryDate}
                  onChange={(e) => setBloodForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Add Blood</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
          const stock = inventory.find((inv) => inv.bloodGroup === bg);
          return (
            <Card key={bg}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{bg}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stock?.quantity || 0}</div>
                <p className="text-xs text-muted-foreground">units available</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
