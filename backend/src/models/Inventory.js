const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 100,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 20
  },
  reorderQuantity: {
    type: Number,
    default: 50
  },
  location: {
    warehouse: String,
    aisle: String,
    shelf: String,
    bin: String,
    section: String
  },
  batchInfo: [{
    batchNumber: String,
    quantity: Number,
    manufacturingDate: Date,
    expiryDate: Date,
    supplier: String,
    cost: Number
  }],
  movements: [{
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return', 'damage'],
      required: true
    },
    quantity: Number,
    reason: String,
    reference: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastRestocked: Date,
  lastSold: Date,
  lastCounted: Date,
  expiryDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'overstock']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
inventorySchema.index({ product: 1, seller: 1 }, { unique: true });
inventorySchema.index({ stockLevel: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ 'alerts.resolved': 1 });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.stockLevel === 0) return 'out_of_stock';
  if (this.stockLevel <= this.minStockLevel) return 'low_stock';
  if (this.stockLevel >= this.maxStockLevel * 0.9) return 'overstock';
  return 'in_stock';
});

// Method to add stock
inventorySchema.methods.addStock = function(quantity, reason = 'restock', reference = '') {
  this.stockLevel += quantity;
  this.lastRestocked = new Date();
  
  this.movements.push({
    type: 'in',
    quantity,
    reason,
    reference
  });
  
  return this.save();
};

// Method to remove stock
inventorySchema.methods.removeStock = function(quantity, reason = 'sale', reference = '') {
  if (this.stockLevel < quantity) {
    throw new Error('Insufficient stock');
  }
  
  this.stockLevel -= quantity;
  this.lastSold = new Date();
  
  this.movements.push({
    type: 'out',
    quantity,
    reason,
    reference
  });
  
  return this.save();
};

// Method to check and create alerts
inventorySchema.methods.checkAlerts = function() {
  const alerts = [];
  
  // Check stock levels
  if (this.stockLevel === 0) {
    alerts.push({
      type: 'out_of_stock',
      message: 'Product is out of stock',
      severity: 'critical'
    });
  } else if (this.stockLevel <= this.minStockLevel) {
    alerts.push({
      type: 'low_stock',
      message: `Stock level (${this.stockLevel}) is below minimum (${this.minStockLevel})`,
      severity: 'high'
    });
  } else if (this.stockLevel >= this.maxStockLevel * 0.9) {
    alerts.push({
      type: 'overstock',
      message: `Stock level (${this.stockLevel}) is near maximum capacity`,
      severity: 'low'
    });
  }
  
  // Check expiry
  if (this.expiryDate) {
    const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      alerts.push({
        type: 'expired',
        message: 'Product has expired',
        severity: 'critical'
      });
    } else if (daysUntilExpiry <= 30) {
      alerts.push({
        type: 'expiring_soon',
        message: `Product expires in ${daysUntilExpiry} days`,
        severity: daysUntilExpiry <= 7 ? 'high' : 'medium'
      });
    }
  }
  
  // Add new alerts
  alerts.forEach(alert => {
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && !a.resolved
    );
    
    if (!existingAlert) {
      this.alerts.push(alert);
    }
  });
  
  return this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);
