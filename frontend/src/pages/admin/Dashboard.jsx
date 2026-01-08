import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { CheckCircle, XCircle, Trash2, TrendingUp, Users, Droplet, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [bbRes, hRes, aRes] = await Promise.all([
        api.get('/admin/bloodbanks'),
        api.get('/admin/hospitals'),
        api.get('/admin/analytics'),
      ]);
      setBloodBanks(bbRes.data.data.bloodBanks || []);
      setHospitals(hRes.data.data.hospitals || []);
      setAnalytics(aRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch data';
      setError(errorMessage);
      toast({
        title: 'Error loading data',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, type) => {
    try {
      await api.patch(`/admin/verify/${id}`);
      toast({ title: 'Success', description: `${type} verified successfully` });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to verify',
        variant: 'destructive',
      });
    }
  };

  const handleUnverify = async (id, type) => {
    try {
      await api.patch(`/admin/unverify/${id}`);
      toast({ title: 'Success', description: `${type} unverified successfully` });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unverify',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast({ title: 'Success', description: 'User removed successfully' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics && bloodBanks.length === 0 && hospitals.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage blood banks, hospitals, and view system analytics</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchData}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage blood banks, hospitals, and view system analytics</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Blood Units</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBloodUnits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDonors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.pendingRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDonations}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Analytics data not available</p>
          </CardContent>
        </Card>
      )}

      {/* Blood Banks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Banks</CardTitle>
          <CardDescription>Manage and verify blood banks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloodBanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No blood banks registered yet
                  </TableCell>
                </TableRow>
              ) : (
                bloodBanks.map((bb) => (
                  <TableRow key={bb._id}>
                    <TableCell>{bb.profile?.name || 'N/A'}</TableCell>
                    <TableCell>{bb.email}</TableCell>
                    <TableCell>
                      {bb.profile?.address?.city || 'N/A'}, {bb.profile?.address?.state || ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bb.profile?.isVerified ? 'success' : 'warning'}>
                        {bb.profile?.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!bb.profile?.isVerified ? (
                          <Button size="sm" onClick={() => handleVerify(bb._id, 'Blood Bank')}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleUnverify(bb._id, 'Blood Bank')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Unverify
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleRemove(bb._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hospitals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hospitals</CardTitle>
          <CardDescription>Manage and verify hospitals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hospitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hospitals registered yet
                  </TableCell>
                </TableRow>
              ) : (
                hospitals.map((h) => (
                  <TableRow key={h._id}>
                    <TableCell>{h.profile?.name || 'N/A'}</TableCell>
                    <TableCell>{h.email}</TableCell>
                    <TableCell>
                      {h.profile?.address?.city || 'N/A'}, {h.profile?.address?.state || ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={h.profile?.isVerified ? 'success' : 'warning'}>
                        {h.profile?.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!h.profile?.isVerified ? (
                          <Button size="sm" onClick={() => handleVerify(h._id, 'Hospital')}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleUnverify(h._id, 'Hospital')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Unverify
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleRemove(h._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

