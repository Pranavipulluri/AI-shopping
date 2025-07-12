import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Camera, MessageSquare, Receipt,
  TrendingUp, Package, DollarSign, Heart,
  ArrowRight, Clock, Star, Percent
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { useQuery } from 'react-query';
import { analytics } from '../../services/api';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { cart } = useCart();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'customerDashboard',
    async () => {
      const [spending, health, recentOrders] = await Promise.all([
        analytics.getSpendingAnalytics({ timeRange: 'month' }),
        analytics.getHealthInsights(),
        analytics.getRecentOrders()
      ]);
      return { spending, health, recentOrders };
    },
    { refetchInterval: 60000 } // Refresh every minute
  );

  const quickActions = [
    {
      title: 'Scan Product',
      description: 'Scan barcode or image',
      icon: Camera,
      link: '/customer/scan',
      color: 'bg-blue-500'
    },
    {
      title: 'AI Assistant',
      description: 'Get product recommendations',
      icon: MessageSquare,
      link: '/customer/chat',
      color: 'bg-green-500'
    },
    {
      title: 'Upload Bill',
      description: 'Track your expenses',
      icon: Receipt,
      link: '/customer/bill-upload',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'See spending insights',
      icon: TrendingUp,
      link: '/customer/analytics',
      color: 'bg-orange-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-indigo-100 mb-6">
          Here's your shopping summary for this month
        </p>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <DollarSign className="w-8 h-8 mb-2" />
            <p className="text-sm text-indigo-100">Total Spent</p>
            <p className="text-2xl font-bold">{formatCurrency(dashboardData?.spending?.totalSpent || 0)}</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <Percent className="w-8 h-8 mb-2" />
            <p className="text-sm text-indigo-100">Total Saved</p>
            <p className="text-2xl font-bold">{formatCurrency(dashboardData?.spending?.totalSavings || 0)}</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <Heart className="w-8 h-8 mb-2" />
            <p className="text-sm text-indigo-100">Health Score</p>
            <p className="text-2xl font-bold">{dashboardData?.health?.averageHealthScore || 0}/10</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <ShoppingCart className="w-8 h-8 mb-2" />
            <p className="text-sm text-indigo-100">Cart Items</p>
            <p className="text-2xl font-bold">{cart?.totalItems || 0}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
              <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                Go now
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link to="/customer/orders" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {dashboardData?.recentOrders?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} items • {formatRelativeTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-sm text-green-600">
                      Saved {formatCurrency(order.savings || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent orders</p>
              <Link to="/customer/scan" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2 inline-block">
                Start shopping
              </Link>
            </div>
          )}
        </motion.div>

        {/* Health Insights */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Health Insights</h2>
            <Link to="/customer/analytics" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View details
            </Link>
          </div>
          
          {dashboardData?.health?.recommendations?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.health.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4">
                <h4 className="font-medium mb-3">Your Health Goals Progress</h4>
                {dashboardData.health.dietaryGoals?.map((goal, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{goal.name}</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No health insights yet</p>
              <p className="text-sm text-gray-400 mt-1">Shop more to get personalized insights</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recommended Products */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recommended for You</h2>
          <Link to="/customer/products" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Browse all
          </Link>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="group cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 group-hover:shadow-md transition-shadow">
                <img
                  src={`/api/placeholder/200/200`}
                  alt="Product"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="font-medium text-sm">Product Name</h3>
              <p className="text-sm text-gray-600">Category</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-indigo-600">₹99</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">4.5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
