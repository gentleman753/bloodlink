import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from './components/ui/toaster';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
// import BloodBankDashboard from './pages/bloodbank/Dashboard'; // Split into sub-pages
import BloodBankOverview from './pages/bloodbank/Overview';
import BloodBankInventory from './pages/bloodbank/Inventory';
import BloodBankRequests from './pages/bloodbank/Requests';
import BloodBankCamps from './pages/bloodbank/Camps';
import HospitalDashboard from './pages/hospital/Dashboard';
import DonorDashboard from './pages/donor/Dashboard';
import Layout from './components/Layout';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/bloodbank/*"
        element={
          <ProtectedRoute allowedRoles={['bloodbank']}>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BloodBankOverview />} />
                <Route path="inventory" element={<BloodBankInventory />} />
                <Route path="requests" element={<BloodBankRequests />} />
                <Route path="camps" element={<BloodBankCamps />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/hospital/*"
        element={
          <ProtectedRoute allowedRoles={['hospital']}>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<HospitalDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/donor/*"
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DonorDashboard />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={!user ? <Home /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
