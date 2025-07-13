import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Package, Clock, TrendingDown, 
  CheckCircle, X, Filter, Bell, AlertCircle 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { inventory } from '../../services/api';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AlertsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Fetch alerts
  const { data: alertsData, isLoading } = useQuery(
    ['alerts', filter],
    () => inventory.getAlerts(filter),
    { refetchInterval: 30000 }
  );

  // Resolve alert mutation
  const resolveMutation = useMutation(
    (alertId) => inventory.resolveAlert(alertId),
    {
      onSuccess: () => {
        toast.success('Alert resolved');
        queryClient.invalidateQueries('alerts');
      }
    }
  );

  const alertTypes = {
    low_stock: {
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200'
    },
    out_of_stock: {
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200'
    },
    expiring_soon: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200'
    },
    expired: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200'
    },
    overstock: {
      icon: TrendingDown,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    }
  };

  const filters = [
    { value: 'all', label: 'All Alerts' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  };

  const handleResolve = (alert) => {
    if (window.confirm('Mark this alert as resolved?')) {
      resolveMutation.mutate(alert._id);
    }
  };

  const groupedAlerts = alertsData?.alerts?.reduce((acc, alert) => {
    const priority = alert.priority || 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(alert);
    return acc;
  }, {}) || {};

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Inventory Alerts
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage inventory issues
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total Alerts:</span>
            <span className="text-2xl font-bold text-indigo-600">
              {alertsData?.count || 0}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {Object.entries({
          critical: { count: alertsData?.summary?.critical || 0, color: 'red' },
          high: { count: alertsData?.summary?.high || 0, color: 'orange' },
          medium: { count: alertsData?.summary?.medium || 0, color: 'yellow' },
          low: { count: alertsData?.summary?.low || 0, color: 'blue' }
        }).map(([priority, data]) => (
          <motion.div
            key={priority}
            whileHover={{ scale: 1.02 }}
            className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-${data.color}-500`}
          >
            <p className="text-sm text-gray-600 capitalize">{priority} Priority</p>
            <p className={`text-3xl font-bold text-${data.color}-600`}>{data.count}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([priority, alerts]) => (
            <div key={priority} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${priorityColors[priority]}`} />
                {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                <span className="text-sm text-gray-500">({alerts.length})</span>
              </h2>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {alerts.map((alert) => {
                    const config = alertTypes[alert.type] || alertTypes.low_stock;
                    const Icon = config.icon;
                    
                    return (
                      <motion.div
                        key={alert._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-white`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {alert.product}
                                </h3>
                                <p className={`text-sm ${config.color} font-medium`}>
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatRelativeTime(alert.createdAt)}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedAlert(alert)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <AlertCircle className="w-5 h-5" />
                                </button>
                                
                                {!alert.resolved && (
                                  <button
                                    onClick={() => handleResolve(alert)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {alert.data && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {alert.data.currentStock !== undefined && (
                                  <span className="text-xs bg-white px-2 py-1 rounded">
                                    Stock: {alert.data.currentStock}
                                  </span>
                                )}
                                {alert.data.minStock && (
                                  <span className="text-xs bg-white px-2 py-1 rounded">
                                    Min: {alert.data.minStock}
                                  </span>
                                )}
                                {alert.data.expiryDate && (
                                  <span className="text-xs bg-white px-2 py-1 rounded">
                                    Expires: {formatDate(alert.data.expiryDate)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert Details Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Product</label>
                  <p className="font-medium">{selectedAlert.product}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Alert Type</label>
                  <p className="font-medium capitalize">
                    {selectedAlert.type.replace('_', ' ')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Priority</label>
                  <p className="font-medium capitalize">{selectedAlert.priority}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Message</label>
                  <p className="font-medium">{selectedAlert.message}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="font-medium">
                    {formatDate(selectedAlert.createdAt, 'PPpp')}
                  </p>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  
                  {!selectedAlert.resolved && (
                    <button
                      onClick={() => {
                        handleResolve(selectedAlert);
                        setSelectedAlert(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
