import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, Package,
  Calendar, Download, Filter, Users, ShoppingBag
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  AreaChart, Area, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useQuery } from 'react-query';
import { analytics } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function SalesAnalytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery(
    ['salesAnalytics', timeRange, selectedCategory],
    () => analytics.getSalesAnalytics({ timeRange, category: selectedCategory }),
    { refetchInterval: 60000 }
  );

  const timeRanges = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  // Download report
  const downloadReport = () => {
    // Implement CSV/PDF download
    toast.success('Report download started');
  };

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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Sales Analytics
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Time Range Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={downloadReport}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +{analyticsData?.growthMetrics?.revenueGrowth || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold">
            {formatCurrency(analyticsData?.summary?.totalRevenue || 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              +{analyticsData?.growthMetrics?.ordersGrowth || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold">{analyticsData?.summary?.totalOrders || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600">
              +{analyticsData?.growthMetrics?.unitsGrowth || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Units Sold</p>
          <p className="text-2xl font-bold">{analyticsData?.summary?.totalUnits || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-600">
              +{analyticsData?.growthMetrics?.customersGrowth || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-2xl font-bold">
            {formatCurrency(analyticsData?.summary?.averageOrderValue || 0)}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData?.salesData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.date" tickFormatter={(date) => formatDate(date, 'MMM dd')} />
              <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Category Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.categoryPerformance || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {analyticsData?.categoryPerformance?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {analyticsData?.topProducts?.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(product.revenue)}</p>
                  <p className="text-sm text-gray-600">{product.unitsSold} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Hour */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Sales by Time of Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.salesByHour || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Insights</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Best Performing</h3>
            <ul className="space-y-1 text-sm text-green-700">
              <li>• Revenue increased by {analyticsData?.growthMetrics?.revenueGrowth || 0}%</li>
              <li>• {analyticsData?.topProducts?.[0]?.name} is your bestseller</li>
              <li>• Peak sales time: 2-4 PM</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Opportunities</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Low stock items need restocking</li>
              <li>• Consider promotions for slow-moving items</li>
              <li>• Weekend sales are 20% lower</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Recommendations</h3>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Stock up on trending products</li>
              <li>• Run weekend promotions</li>
              <li>• Focus on high-margin categories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}