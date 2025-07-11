import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, ShoppingCart, Package, BarChart3, MessageSquare,
  Receipt, Camera, Bell, Users, TrendingUp, AlertTriangle,
  Upload, Eye, Settings, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ userRole, sidebarOpen, setSidebarOpen }) {
  const customerLinks = [
    { to: '/customer', icon: Home, label: 'Dashboard', exact: true },
    { to: '/customer/scan', icon: Camera, label: 'Scan Products' },
    { to: '/customer/cart', icon: ShoppingCart, label: 'Smart Cart' },
    { to: '/customer/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/customer/bill-upload', icon: Receipt, label: 'Upload Bill' },
    { to: '/customer/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const sellerLinks = [
    { to: '/seller', icon: Home, label: 'Dashboard', exact: true },
    { to: '/seller/inventory', icon: Package, label: 'Inventory' },
    { to: '/seller/upload', icon: Upload, label: 'Add Product' },
    { to: '/seller/shelf-monitor', icon: Eye, label: 'Shelf Monitor' },
    { to: '/seller/alerts', icon: AlertTriangle, label: 'Alerts' },
    { to: '/seller/analytics', icon: TrendingUp, label: 'Analytics' }
  ];

  const links = userRole === 'customer' ? customerLinks : sellerLinks;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold">Smart Shop</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t">
            <NavLink
              to={`/${userRole}/settings`}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}