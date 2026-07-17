import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { OrderDetails } from './pages/OrderDetails';
import { Customers } from './pages/Customers';
import { Inventory } from './pages/Inventory';
import { CustomerIssues } from './pages/CustomerIssues';
import { Reports } from './pages/Reports';
import { BusinessSettings } from './pages/BusinessSettings';
import { Login } from './pages/Login';

// Protected Route Component for Admin Dashboard access
const ProtectedRoute = ({ children }) => {
  const { user, profile, loading, error } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: '120px', height: '40px', borderRadius: 'var(--radius-md)' }}></div>
      </div>
    );
  }

  // If not logged in, or there is an authorization role error
  if (!user || error) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Portal */}
          <Route path="/login" element={<Login />} />

          {/* Secure Admin Dashboard Portal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="customers" element={<Customers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customer-issues" element={<CustomerIssues />} />
            <Route path="reports" element={<Reports />} />
            <Route path="business-settings" element={<BusinessSettings />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
