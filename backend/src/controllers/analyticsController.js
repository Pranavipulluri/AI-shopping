const Order = require('../models/Order');
const Product = require('../models/Product');
const Analytics = require('../models/Analytics');
const { startOfWeek, startOfMonth, startOfYear, subDays } = require('date-fns');

// @desc    Get customer spending analytics
// @route   GET /api/analytics/customer/spending
// @access  Private (Customer)
exports.getCustomerSpending = async (req, res) => {
  try {
    const { timeRange = 'month', category } = req.query;
    const userId = req.user.id;

    // Determine date range
    let startDate;
    const endDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(endDate);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      case 'year':
        startDate = startOfYear(endDate);
        break;
      default:
        startDate = startOfMonth(endDate);
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      }
    ];

    if (category && category !== 'all') {
      pipeline.push({
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      });
      pipeline.push({
        $match: {
          'productDetails.category': category
        }
      });
    }

    // Calculate totals
    const orders = await Order.aggregate(pipeline);

    const analytics = calculateSpendingAnalytics(orders);

    // Get spending trend
    const spendingTrend = await getSpendingTrend(userId, startDate, endDate);

    // Get category breakdown
    const categoryBreakdown = await getCategoryBreakdown(userId, startDate, endDate);

    // Get top products
    const topProducts = await getTopProducts(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      ...analytics,
      spendingTrend,
      categoryBreakdown,
      topProducts
    });
  } catch (error) {
    console.error('Get spending analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// @desc    Get health insights
// @route   GET /api/analytics/customer/insights
// @access  Private (Customer)
exports.getHealthInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const userPreferences = req.user.preferences;

    // Get recent purchases
    const recentOrders = await Order.find({
      user: userId,
      status: 'completed',
      createdAt: { $gte: subDays(new Date(), 30) }
    }).populate('items.product');

    // Calculate health metrics
    const healthMetrics = calculateHealthMetrics(recentOrders);

    // Generate recommendations
    const recommendations = generateHealthRecommendations(
      healthMetrics,
      userPreferences
    );

    // Calculate dietary goals progress
    const dietaryGoals = calculateDietaryGoalsProgress(
      recentOrders,
      userPreferences.dietaryRestrictions || []
    );

    res.status(200).json({
      success: true,
      averageHealthScore: healthMetrics.averageHealthScore,
      healthTrend: healthMetrics.trend,
      recommendations,
      dietaryGoals,
      metrics: healthMetrics
    });
  } catch (error) {
    console.error('Get health insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health insights'
    });
  }
};

// @desc    Get sales analytics (Seller)
// @route   GET /api/analytics/seller/sales
// @access  Private (Seller)
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { timeRange = 'month', productId } = req.query;
    const sellerId = req.user.id;

    // Determine date range
    let startDate;
    const endDate = new Date();

    switch (timeRange) {
      case 'day':
        startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = startOfWeek(endDate);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      case 'year':
        startDate = startOfYear(endDate);
        break;
    }

    // Build query
    const query = {
      seller: sellerId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (productId) {
      query.product = productId;
    }

    // Get sales data
    const salesData = await Analytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          revenue: { $sum: '$revenue' },
          unitsSold: { $sum: '$unitsSold' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get top selling products
    const topProducts = await getTopSellingProducts(sellerId, startDate, endDate);

    // Get category performance
    const categoryPerformance = await getCategoryPerformance(sellerId, startDate, endDate);

    // Calculate growth metrics
    const growthMetrics = await calculateGrowthMetrics(sellerId, startDate, endDate);

    res.status(200).json({
      success: true,
      salesData,
      topProducts,
      categoryPerformance,
      growthMetrics,
      summary: {
        totalRevenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
        totalOrders: salesData.reduce((sum, day) => sum + day.orders, 0),
        totalUnits: salesData.reduce((sum, day) => sum + day.unitsSold, 0),
        averageOrderValue: salesData.length > 0 
          ? salesData.reduce((sum, day) => sum + day.revenue, 0) / salesData.reduce((sum, day) => sum + day.orders, 0)
          : 0
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics'
    });
  }
};

// @desc    Get demand predictions
// @route   GET /api/analytics/seller/predictions
// @access  Private (Seller)
exports.getDemandPredictions = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get historical sales data
    const historicalData = await Analytics.find({
      seller: sellerId,
      createdAt: { $gte: subDays(new Date(), 90) }
    }).populate('product', 'name category');

    // Generate predictions (simplified - in production use proper ML)
    const predictions = await generateDemandPredictions(historicalData);

    // Get seasonal trends
    const seasonalTrends = analyzeSeasonalTrends(historicalData);

    // Get recommendations
    const recommendations = generateInventoryRecommendations(predictions, seasonalTrends);

    res.status(200).json({
      success: true,
      predictions,
      seasonalTrends,
      recommendations
    });
  } catch (error) {
    console.error('Get demand predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictions'
    });
  }
};

// Helper functions
function calculateSpendingAnalytics(orders) {
  let totalSpent = 0;
  let totalSavings = 0;
  let totalItems = 0;

  orders.forEach(order => {
    totalSpent += order.totalAmount;
    totalSavings += order.savings || 0;
    totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  return {
    totalSpent,
    totalSavings,
    totalItems,
    averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
    ordersCount: orders.length
  };
}

async function getSpendingTrend(userId, startDate, endDate) {
  const trend = await Order.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        amount: { $sum: '$totalAmount' },
        savings: { $sum: '$savings' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return trend.map(day => ({
    date: day._id,
    amount: day.amount,
    savings: day.savings
  }));
}

async function getCategoryBreakdown(userId, startDate, endDate) {
  const breakdown = await Order.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    }
  ]);

  return breakdown.map(cat => ({
    name: cat._id,
    value: cat.value
  }));
}

async function getTopProducts(userId, startDate, endDate) {
  const products = await Order.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSpent: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        count: { $sum: '$items.quantity' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);

  return products.map(p => ({
    name: p.product.name,
    category: p.product.category,
    totalSpent: p.totalSpent,
    count: p.count
  }));
}

function calculateHealthMetrics(orders) {
  let totalHealthScore = 0;
  let productCount = 0;
  const categoryHealth = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.product && item.product.healthScore) {
        totalHealthScore += item.product.healthScore * item.quantity;
        productCount += item.quantity;
        
        const category = item.product.category;
        if (!categoryHealth[category]) {
          categoryHealth[category] = { total: 0, count: 0 };
        }
        categoryHealth[category].total += item.product.healthScore * item.quantity;
        categoryHealth[category].count += item.quantity;
      }
    });
  });

  const averageHealthScore = productCount > 0 ? (totalHealthScore / productCount).toFixed(1) : 0;
  
  // Calculate trend (simplified)
  const trend = averageHealthScore >= 7 ? 'Improving' : averageHealthScore >= 5 ? 'Stable' : 'Needs Attention';

  return {
    averageHealthScore: parseFloat(averageHealthScore),
    trend,
    categoryHealth: Object.entries(categoryHealth).map(([category, data]) => ({
      category,
      averageScore: (data.total / data.count).toFixed(1)
    }))
  };
}

function generateHealthRecommendations(metrics, preferences) {
  const recommendations = [];

  if (metrics.averageHealthScore < 6) {
    recommendations.push({
      type: 'warning',
      title: 'Health Score Below Target',
      message: 'Your recent purchases have a low average health score. Consider choosing healthier alternatives.',
      alternatives: ['Whole grains', 'Fresh fruits', 'Vegetables', 'Lean proteins']
    });
  }

  // Check specific categories
  metrics.categoryHealth.forEach(cat => {
    if (cat.averageScore < 5) {
      recommendations.push({
        type: 'improvement',
        title: `Improve ${cat.category} Choices`,
        message: `Your ${cat.category} purchases could be healthier.`,
        alternatives: getHealthierAlternatives(cat.category)
      });
    }
  });

  return recommendations;
}

function getHealthierAlternatives(category) {
  const alternatives = {
    snacks: ['Nuts', 'Fresh fruits', 'Yogurt', 'Whole grain crackers'],
    beverages: ['Water', 'Green tea', 'Fresh juice', 'Coconut water'],
    dairy: ['Low-fat milk', 'Greek yogurt', 'Cottage cheese'],
    groceries: ['Brown rice', 'Quinoa', 'Whole wheat flour', 'Olive oil']
  };
  
  return alternatives[category] || [];
}

function calculateDietaryGoalsProgress(orders, restrictions) {
  // Simplified implementation
  return [
    {
      name: 'Reduce Sugar Intake',
      progress: 75,
      target: '< 50g/day',
      current: '37g/day'
    },
    {
      name: 'Increase Protein',
      progress: 60,
      target: '> 60g/day',
      current: '36g/day'
    },
    {
      name: 'More Vegetables',
      progress: 40,
      target: '5 servings/day',
      current: '2 servings/day'
    }
  ];
}

async function generateDemandPredictions(historicalData) {
  // Group by product
  const productData = {};
  
  historicalData.forEach(record => {
    const productId = record.product._id.toString();
    if (!productData[productId]) {
      productData[productId] = {
        product: record.product,
        sales: []
      };
    }
    productData[productId].sales.push({
      date: record.createdAt,
      units: record.unitsSold
    });
  });

  // Generate predictions (simplified moving average)
  const predictions = [];
  
  Object.values(productData).forEach(data => {
    const recentSales = data.sales.slice(-30);
    const avgDailySales = recentSales.reduce((sum, s) => sum + s.units, 0) / recentSales.length;
    
    predictions.push({
      product: data.product.name,
      category: data.product.category,
      predictedDemand: {
        daily: Math.ceil(avgDailySales),
        weekly: Math.ceil(avgDailySales * 7),
        monthly: Math.ceil(avgDailySales * 30)
      },
      confidence: 0.75, // Simplified confidence score
      trend: avgDailySales > 0 ? 'stable' : 'declining'
    });
  });

  return predictions;
}

function analyzeSeasonalTrends(historicalData) {
  // Simplified seasonal analysis
  return {
    currentSeason: 'summer',
    trends: [
      {
        category: 'beverages',
        trend: 'increasing',
        factor: 1.3
      },
      {
        category: 'snacks',
        trend: 'stable',
        factor: 1.0
      }
    ]
  };
}

function generateInventoryRecommendations(predictions, seasonalTrends) {
  const recommendations = [];

  predictions.forEach(pred => {
    if (pred.predictedDemand.weekly > 100) {
      recommendations.push({
        product: pred.product,
        action: 'increase_stock',
        reason: 'High predicted demand',
        suggestedStock: pred.predictedDemand.weekly * 1.2
      });
    }
  });

  return recommendations;
}