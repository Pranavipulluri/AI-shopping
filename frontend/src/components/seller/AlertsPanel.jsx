import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, Clock, TrendingUp, Filter, Check, X, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { inventory } from '../../services/api';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function AlertsPanel() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Fetch alerts
  const { data: alertsData, isLoading } = useQuery(
    ['alerts', filterType, filterPriority],
    () => inventory.getAlerts({ type: filterType, priority: filterPriority }),
    { refetchInterval: 30000 }
  );

  // Resolve alert mutation
  const resolveAlertMutation = useMutation(
    (alertId) => inventory.resolveAlert(alertId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('alerts');
        toast.success('Alert resolved');
      }
    }
  );

  const alertTypes = [
    { value: 'all', label: 'All Alerts', icon: AlertTriangle },
    { value: 'low_stock', label: 'Low Stock', icon: Package },
    { value: 'expiring_soon', label: 'Expiring Soon', icon: Clock },
    { value: 'overstock', label: 'Overstock', icon: TrendingUp }
  ];

  const priorityLevels = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-blue-600' }
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return Package;
      case 'expiring_soon':
      case 'expired':
        return Clock;
      case 'overstock':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Inventory Alerts
          </h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {alertsData?.count || 0} active alerts
            </span>
            <span className="text-sm">
              <span className="font-medium text-red-600">{alertsData?.alerts?.critical || 0} Critical</span>
              {' • '}
              <span className="font-medium text-yellow-600">{alertsData?.alerts?.warning || 0} Warning</span>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            {alertTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterType === type.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {priorityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <AnimatePresence>
          {alertsData?.alerts?.length > 0 ? (
            alertsData.alerts.map((alert, index) => {
              const Icon = getAlertIcon(alert.type);
              
              return (
                <motion.div
                  key={alert._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-lg shadow-md border-l-4 p-6 ${getAlertColor(alert.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-white shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{alert.product}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{alert.message}</p>
                        
                        {alert.data && (
                          <div className="flex flex-wrap gap-4 text-sm">
                            {alert.data.currentStock !== undefined && (
                              <span>
                                Current Stock: <strong>{alert.data.currentStock}</strong>
                              </span>
                            )}
                            {alert.data.minStock !== undefined && (
                              <span>
                                Min Required: <strong>{alert.data.minStock}</strong>
                              </span>
                            )}
                            {alert.data.expiryDate && (
                              <span>
                                Expires: <strong>{formatRelativeTime(alert.data.expiryDate)}</strong>
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-4 flex items-center gap-4">
                          <button
                            onClick={() => resolveAlertMutation.mutate(alert._id)}
                            className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Mark as Resolved
                          </button>
                          
                          <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1">
                            View Product
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => resolveAlertMutation.mutate(alert._id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Alerts</h3>
              <p className="text-gray-500">Your inventory is in good shape!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}