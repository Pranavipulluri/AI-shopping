const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sale', 'view', 'search', 'cart_add', 'cart_remove'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  category: String,
  // Sale specific fields
  revenue: {
    type: Number,
    default: 0
  },
  unitsSold: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  // Search specific fields
  searchQuery: String,
  searchResults: Number,
  // User behavior
  sessionId: String,
  userAgent: String,
  ipAddress: String,
  location: {
    city: String,
    state: String,
    country: String
  },
  // Performance metrics
  responseTime: Number,
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ seller: 1, createdAt: -1 });
analyticsSchema.index({ product: 1, createdAt: -1 });
analyticsSchema.index({ category: 1, createdAt: -1 });

// Static method to record analytics event
analyticsSchema.statics.recordEvent = async function(eventData) {
  return await this.create(eventData);
};

// Static method to get aggregated data
analyticsSchema.statics.getAggregatedData = async function(query, groupBy, dateRange) {
  const pipeline = [];
  
  // Match stage
  if (dateRange) {
    query.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  pipeline.push({ $match: query });
  
  // Group stage
  const groupStage = {
    _id: {}
  };
  
  if (groupBy.includes('date')) {
    groupStage._id.date = {
      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
    };
  }
  
  if (groupBy.includes('product')) {
    groupStage._id.product = '$product';
  }
  
  if (groupBy.includes('category')) {
    groupStage._id.category = '$category';
  }
  
  // Add aggregation fields
  groupStage.count = { $sum: 1 };
  groupStage.revenue = { $sum: '$revenue' };
  groupStage.unitsSold = { $sum: '$unitsSold' };
  
  pipeline.push({ $group: groupStage });
  pipeline.push({ $sort: { '_id.date': -1 } });
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Analytics', analyticsSchema);
