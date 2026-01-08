import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

export default function BloodBankOverview() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, reqRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/requests'),
      ]);
      setInventory(invRes.data.data.inventory);
      setRequests(reqRes.data.data.requests);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Calculate analytics
  const requestsByGroup = requests.reduce((acc, req) => {
    acc[req.bloodGroup] = (acc[req.bloodGroup] || 0) + 1;
    return acc;
  }, {});
  const chartDataGroup = Object.entries(requestsByGroup).map(([name, value]) => ({ name, value }));

  const requestsByStatus = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});
  const chartDataStatus = Object.entries(requestsByStatus).map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Welcome back to your dashboard</p>
      </div>

      {/* Inventory Summary */}
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

      {/* Analytics Charts */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="h-5 w-5" />
                Requests by Blood Group
              </CardTitle>
              <CardDescription>Number of requests per blood group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataGroup}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Requests" fill="#e11d48" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="h-5 w-5" />
                Requests by Status
              </CardTitle>
              <CardDescription>Distribution of request statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartDataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
