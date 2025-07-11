import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, ShoppingBag, Heart, AlertTriangle, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useQuery } from 'react-query';

// Services
import { getSpendingAnalytics, getHealthInsights } from '../../services/api';

export default function SpendingAnalytics() {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery(
    ['analytics', timeRange, selectedCategory],
    () => getSpendingAnalytics({ timeRange, category: selectedCategory }),
    { refetchInterval: 60000 } // Refresh every minute
  );

  // Fetch health insights
  const { data: healthInsights } = useQuery(
    'healthInsights',
    getHealthInsights
  );

  // Colors for charts
  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  // Calculate savings percentage
  const savingsPercentage = analytics?.totalSavings 
    ? ((analytics.totalSavings / (analytics.totalSpent + analytics.totalSavings)) * 100).toFixed(1)
    : 0;

  // Download report
  const downloadReport = () => {
    // In a real app, this would generate a PDF report
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Spending Analytics
          </h1>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            
            <button
              onClick={downloadReport}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Total Spent"
          value={`₹${analytics?.totalSpent?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="indigo"
          trend={analytics?.spentTrend}
        />
        
        <MetricCard
          title="Total Savings"
          value={`₹${analytics?.totalSavings?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="green"
          subtext={`${savingsPercentage}% saved`}
        />
        
        <MetricCard
          title="Items Purchased"
          value={analytics?.totalItems || 0}
          icon={ShoppingBag}
          color="blue"
          trend={analytics?.itemsTrend}
        />
        
        <MetricCard
          title="Health Score"
          value={`${healthInsights?.averageHealthScore || 0}/10`}
          icon={Heart}
          color={healthInsights?.averageHealthScore >= 7 ? 'green' : 'yellow'}
          subtext={healthInsights?.healthTrend || 'Stable'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Spending Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.spendingTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#6366F1" 
                strokeWidth={2}
                name="Amount Spent"
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Savings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.categoryBreakdown || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics?.categoryBreakdown?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top Purchased Products</h2>
          <div className="space-y-3">
            {analytics?.topProducts?.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{product.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{product.count} times</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Insights */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Health Insights</h2>
          
          {healthInsights?.recommendations?.map((insight, index) => (
            <div key={index} className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                {insight.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                  {insight.alternatives && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Try these alternatives:</p>
                      <ul className="mt-1 space-y-1">
                        {insight.alternatives.map((alt, i) => (
                          <li key={i} className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
                            • {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Dietary Goals Progress</h4>
            <div className="space-y-2">
              {healthInsights?.dietaryGoals?.map((goal, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{goal.name}</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon: Icon, color, trend, subtext }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && (
        <p className="text-sm text-gray-500 mt-1">{subtext}</p>
      )}
    </motion.div>
  );
}