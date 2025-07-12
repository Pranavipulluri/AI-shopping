import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, AlertTriangle, Eye,
  Upload, BarChart3, Users, DollarSign,
  ShoppingBag, Clock, ArrowUp, ArrowDown
} from 'lucide-react';
import { useQuery } from 'react-query';
import { analytics, inventory } from '../../services/api';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerDashboard() {
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'sellerDashboard',
    async () => {
      const [salesData, alerts, predictions, inventoryStats] = await Promise.all([
        analytics.getSalesAnalytics({ timeRange: 'week' }),
        inventory.getAlerts(),
        analytics.getDemandPredictions(),
        inventory.getInventoryStats()
      ]);
      return { salesData, alerts, predictions, inventoryStats };
    },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData?.salesData?.summary?.totalRevenue || 0),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: dashboardData?.salesData?.summary?.totalOrders || 0,
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'bg-blue-500'
    },
    {
      title: 'Products Sold',
      value: dashboardData?.salesData?.summary?.totalUnits || 0,
      change: '-3.1%',
      trend: 'down',
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Alerts',
      value: dashboardData?.alerts?.count || 0,
      change: dashboardData?.alerts?.critical || 0,
      trend: 'critical',
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  const quickActions = [
    {
      title: 'Add Product',
      icon: Upload,
      link: '/seller/upload',
      description: 'Add new products to inventory'
    },
    {
      title: 'Shelf Monitor',
      icon: Eye,
      link: '/seller/shelf-monitor',
      description: 'Check shelf organization'
    },
    {
      title: 'View Alerts',
      icon: AlertTriangle,
      link: '/seller/alerts',
      description: `${dashboardData?.alerts?.count || 0} active alerts`
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      link: '/seller/analytics',
      description: 'Detailed sales reports'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600">Monitor your store performance and inventory</p>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              {metric.trend === 'up' && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {metric.change}
                </div>
              )}
              {metric.trend === 'down' && (
                <div className="flex items-center text-red-600 text-sm font-medium">
                  <ArrowDown className="w-4 h-4 mr-1" />
                  {metric.change}
                </div>
              )}
              {metric.trend === 'critical' && metric.change > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {metric.change} Critical
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.salesData?.salesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366F1" 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {dashboardData?.salesData?.topProducts?.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{product.unitsSold} units</p>
                  <p className="text-sm text-gray-600">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <action.icon className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Alerts</h2>
          <Link to="/seller/alerts" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            View all
          </Link>
        </div>
        
        {dashboardData?.alerts?.alerts?.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.alerts.alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  alert.priority === 'high' ? 'bg-red-50' :
                  alert.priority === 'medium' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  alert.priority === 'high' ? 'text-red-600' :
                  alert.priority === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.product}</p>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                </div>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No active alerts</p>
        )}
      </div>

      {/* Demand Predictions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Demand Predictions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {dashboardData?.predictions?.predictions?.slice(0, 6).map((pred, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">{pred.product}</h4>
              <p className="text-sm text-gray-600 mb-2">{pred.category}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Daily:</span>
                  <span className="font-medium">{pred.predictedDemand.daily} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Weekly:</span>
                  <span className="font-medium">{pred.predictedDemand.weekly} units</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  pred.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                  pred.trend === 'stable' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {pred.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}