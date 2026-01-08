import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { Calendar, History, Download, CheckCircle, XCircle, Search } from 'lucide-react';

export default function DonorDashboard() {
  const [camps, setCamps] = useState([]);
  const [donations, setDonations] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, donationRes, eligibilityRes] = await Promise.all([
        api.get('/camps'),
        api.get('/donor/donations'),
        api.get('/donor/eligibility'),
      ]);
      setCamps(campRes.data.data.camps);
      setDonations(donationRes.data.data.donations);
      setEligibility(eligibilityRes.data.data.eligibility);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCamp = async (campId) => {
    try {
      await api.post(`/camps/${campId}/register`);
      toast({ title: 'Success', description: 'Registered for camp successfully' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to register for camp',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadCertificate = async (donationId) => {
    try {
      const response = await api.get(`/certificate/${donationId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `donation-certificate-${donationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Success', description: 'Certificate downloaded successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to download certificate',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Donor Dashboard</h1>
        <p className="text-muted-foreground">View camps, register for donations, and track your history</p>
      </div>

      {/* Eligibility Status */}
      {eligibility && (
        <Card>
          <CardHeader>
            <CardTitle>Donation Eligibility</CardTitle>
            <CardDescription>Check if you're eligible to donate blood</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {eligibility.canDonate ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-500">You are eligible to donate</p>
                    {eligibility.lastDonationDate && (
                      <p className="text-sm text-muted-foreground">
                        Last donation: {new Date(eligibility.lastDonationDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-500">You are not eligible to donate</p>
                    {eligibility.reason && (
                      <p className="text-sm text-muted-foreground">{eligibility.reason}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Camps */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Donation Camps
              </CardTitle>
              <CardDescription>Register for blood donation camps near you</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search city, state..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {camps
              .filter((camp) =>
                camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                camp.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                camp.location.state.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((camp) => {
                const isRegistered = camp.registeredDonors?.some(
                  (reg) => {
                    const donorId = reg.donor?._id || reg.donor;
                    return donorId?.toString() === user?._id?.toString() || donorId?.toString() === user?.id?.toString();
                  }
                );
                return (
                <Card key={camp._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{camp.name}</CardTitle>
                    <CardDescription>
                      {new Date(camp.date).toLocaleDateString()} • {camp.startTime} - {camp.endTime}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{camp.description || 'Join us for this blood donation camp'}</p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Location:</strong> {camp.location.address}, {camp.location.city}, {camp.location.state}
                      </p>
                      <p className="text-sm">
                        <strong>Registered:</strong> {camp.registeredDonors?.length || 0} donors
                      </p>
                      {isRegistered ? (
                        <Badge variant="success">Registered</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRegisterCamp(camp._id)}
                          disabled={!eligibility?.canDonate}
                        >
                          Register for Camp
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Donation History
          </CardTitle>
          <CardDescription>View your past blood donations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Blood Bank</TableHead>
                <TableHead>Camp</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation._id}>
                  <TableCell>{new Date(donation.donationDate).toLocaleDateString()}</TableCell>
                  <TableCell>{donation.bloodBank?.profile?.name || 'N/A'}</TableCell>
                  <TableCell>{donation.camp?.name || 'Direct Donation'}</TableCell>
                  <TableCell>
                    <Badge>{donation.bloodGroup}</Badge>
                  </TableCell>
                  <TableCell>{donation.quantity} unit(s)</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadCertificate(donation._id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
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

