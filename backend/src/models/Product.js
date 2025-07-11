const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  images: [{
    url: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'groceries',
      'dairy',
      'beverages',
      'snacks',
      'personal_care',
      'household',
      'electronics',
      'clothing',
      'health',
      'baby_care',
      'pet_supplies',
      'other'
    ]
  },
  subcategory: String,
  brand: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen']
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  // Nutritional Information
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    servingSize: String
  },
  ingredients: [String],
  allergens: [String],
  // Health & Alternatives
  healthScore: {
    type: Number,
    min: 0,
    max: 10,
    default: 5
  },
  healthInsights: String,
  alternatives: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    reason: String,
    type: {
      type: String,
      enum: ['healthier', 'cheaper', 'popular']
    }
  }],
  // Inventory & Seller Info
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
    default: 10
  },
  maxStockLevel: {
    type: Number,
    default: 100
  },
  location: {
    aisle: String,
    shelf: String,
    section: String
  },
  // Dates
  manufacturingDate: Date,
  expiryDate: Date,
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // AI/ML Features
  imageFeatures: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  predictedDemand: {
    daily: Number,
    weekly: Number,
    monthly: Number,
    lastUpdated: Date
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionDetails: {
    discount: Number,
    startDate: Date,
    endDate: Date,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'bogo', 'bundle']
    }
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ healthScore: -1 });
productSchema.index({ expiryDate: 1 });
productSchema.index({ seller: 1, isActive: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for days until expiry
productSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Method to check if product needs restocking
productSchema.methods.needsRestocking = function() {
  return this.stockLevel <= this.minStockLevel;
};

// Method to calculate health score based on nutritional info
productSchema.methods.calculateHealthScore = function() {
  if (!this.nutritionalInfo) return 5;
  
  let score = 10;
  
  // Deduct points for high sugar, sodium, etc.
  if (this.nutritionalInfo.sugar > 10) score -= 2;
  if (this.nutritionalInfo.sodium > 500) score -= 2;
  if (this.nutritionalInfo.fat > 20) score -= 1;
  
  // Add points for protein and fiber
  if (this.nutritionalInfo.protein > 10) score += 1;
  if (this.nutritionalInfo.fiber > 5) score += 1;
  
  return Math.max(0, Math.min(10, score));
};

// Static method to find alternatives
productSchema.statics.findAlternatives = async function(productId, type = 'all') {
  const product = await this.findById(productId);
  if (!product) return [];
  
  const query = {
    _id: { $ne: productId },
    category: product.category,
    isActive: true
  };
  
  let sort = {};
  
  switch(type) {
    case 'healthier':
      query.healthScore = { $gt: product.healthScore };
      sort = { healthScore: -1 };
      break;
    case 'cheaper':
      query.price = { $lt: product.price };
      sort = { price: 1 };
      break;
    case 'popular':
      sort = { purchaseCount: -1 };
      break;
    default:
      sort = { healthScore: -1, price: 1 };
  }
  
  return await this.find(query)
    .sort(sort)
    .limit(3)
    .select('name price healthScore images category');
};

// Middleware to update health score before saving
productSchema.pre('save', function(next) {
  if (this.isModified('nutritionalInfo')) {
    this.healthScore = this.calculateHealthScore();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);