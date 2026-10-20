import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BillingPOS from './pages/BillingPOS';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Users from './pages/Users';

function ProtectedLayout({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Both Cashier and Owner routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedLayout>
                <BillingPOS />
              </ProtectedLayout>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedLayout>
                <Products />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedLayout>
                <Customers />
              </ProtectedLayout>
            }
          />

          {/* Owner-Only Routes */}
          <Route
            path="/purchases"
            element={
              <ProtectedLayout requiredRole="owner">
                <Purchases />
              </ProtectedLayout>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedLayout requiredRole="owner">
                <Suppliers />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout requiredRole="owner">
                <Reports />
              </ProtectedLayout>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedLayout requiredRole="owner">
                <Users />
              </ProtectedLayout>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
