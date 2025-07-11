// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Customer Components
import CustomerDashboard from './components/customer/Dashboard';
import ProductScanner from './components/customer/ProductScanner';
import SmartCart from './components/customer/SmartCart';
import ChatBot from './components/customer/ChatBot';
import BillUpload from './components/customer/BillUpload';
import SpendingAnalytics from './components/customer/SpendingAnalytics';

// Seller Components
import SellerDashboard from './components/seller/Dashboard';
import InventoryManagement from './components/seller/InventoryManagement';
import ProductUpload from './components/seller/ProductUpload';
import ShelfMonitor from './components/seller/ShelfMonitor';
import AlertsPanel from './components/seller/AlertsPanel';
import SalesAnalytics from './components/seller/SalesAnalytics';

// Common Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

// Styles
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <Router>
              <div className="App">
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  
                  {/* Protected Customer Routes */}
                  <Route path="/customer" element={
                    <ProtectedRoute role="customer">
                      <CustomerLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<CustomerDashboard />} />
                    <Route path="scan" element={<ProductScanner />} />
                    <Route path="cart" element={<SmartCart />} />
                    <Route path="chat" element={<ChatBot />} />
                    <Route path="bill-upload" element={<BillUpload />} />
                    <Route path="analytics" element={<SpendingAnalytics />} />
                  </Route>
                  
                  {/* Protected Seller Routes */}
                  <Route path="/seller" element={
                    <ProtectedRoute role="seller">
                      <SellerLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<SellerDashboard />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="upload" element={<ProductUpload />} />
                    <Route path="shelf-monitor" element={<ShelfMonitor />} />
                    <Route path="alerts" element={<AlertsPanel />} />
                    <Route path="analytics" element={<SalesAnalytics />} />
                  </Route>
                  
                  {/* Default Route */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Layout Components
function CustomerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="customer" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<CustomerDashboard />} />
            <Route path="scan" element={<ProductScanner />} />
            <Route path="cart" element={<SmartCart />} />
            <Route path="chat" element={<ChatBot />} />
            <Route path="bill-upload" element={<BillUpload />} />
            <Route path="analytics" element={<SpendingAnalytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function SellerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="seller" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<SellerDashboard />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="upload" element={<ProductUpload />} />
            <Route path="shelf-monitor" element={<ShelfMonitor />} />
            <Route path="alerts" element={<AlertsPanel />} />
            <Route path="analytics" element={<SalesAnalytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
