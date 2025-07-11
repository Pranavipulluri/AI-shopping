import { useQuery } from 'react-query';
import { analytics } from '../services/api';

export const useAnalytics = (type, options = {}) => {
  const queryKey = ['analytics', type, options];
  
  const queryFn = async () => {
    switch (type) {
      case 'spending':
        return await analytics.getSpendingAnalytics(options);
      case 'health':
        return await analytics.getHealthInsights();
      case 'sales':
        return await analytics.getSalesAnalytics(options);
      case 'predictions':
        return await analytics.getDemandPredictions();
      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }
  };

  return useQuery(queryKey, queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options.realtime ? 30000 : false,
    ...options
  });
};