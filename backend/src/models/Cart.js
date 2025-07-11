const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  appliedCoupons: [{
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  }],
  savings: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', async function(next) {
  let totalAmount = 0;
  let totalItems = 0;
  let savings = 0;

  // Populate product details if not already populated
  if (this.items.length > 0 && !this.items[0].product.price) {
    await this.populate('items.product');
  }

  this.items.forEach(item => {
    totalAmount += item.price * item.quantity;
    totalItems += item.quantity;
    
    // Calculate savings if original price exists
    if (item.product.originalPrice && item.product.originalPrice > item.price) {
      savings += (item.product.originalPrice - item.price) * item.quantity;
    }
  });

  // Apply coupons
  this.appliedCoupons.forEach(coupon => {
    if (coupon.type === 'percentage') {
      const discount = totalAmount * (coupon.discount / 100);
      totalAmount -= discount;
      savings += discount;
    } else {
      totalAmount -= coupon.discount;
      savings += coupon.discount;
    }
  });

  this.totalAmount = Math.max(0, totalAmount);
  this.totalItems = totalItems;
  this.savings = savings;
  this.lastModified = Date.now();

  next();
});

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      price: product.price
    });
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => 
    item.product.toString() !== productId.toString()
  );
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = quantity;
  }

  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.appliedCoupons = [];
  return this.save();
};

// Static method to get or create cart
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    cart = await this.create({ user: userId });
  }
  
  return cart;
};

module.exports = mongoose.model('Cart', cartSchema);