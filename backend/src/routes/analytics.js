const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Customer analytics routes
router.get('/customer/spending',
  authorize('customer'),
  [
    query('timeRange').optional().isIn(['week', 'month', 'year']),
    query('category').optional().isString()
  ],
  analyticsController.getCustomerSpending
);

router.get('/customer/insights',
  authorize('customer'),
  analyticsController.getHealthInsights
);

router.get('/customer/savings',
  authorize('customer'),
  analyticsController.getSavingsReport
);

// Seller analytics routes
router.get('/seller/sales',
  authorize('seller', 'admin'),
  [
    query('timeRange').optional().isIn(['day', 'week', 'month', 'year']),
    query('productId').optional().isMongoId()
  ],
  analyticsController.getSalesAnalytics
);

router.get('/seller/predictions',
  authorize('seller', 'admin'),
  analyticsController.getDemandPredictions
);

router.get('/seller/performance',
  authorize('seller', 'admin'),
  analyticsController.getPerformanceMetrics
);

module.exports = router;