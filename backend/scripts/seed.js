const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Load models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Category = require('../src/models/Category');

// Sample data
const categories = [
  'groceries', 'dairy', 'beverages', 'snacks', 'personal_care',
  'household', 'electronics', 'clothing', 'health', 'baby_care',
  'pet_supplies', 'other'
];

const sampleProducts = [
  {
    name: 'Organic Whole Wheat Bread',
    category: 'groceries',
    price: 45,
    barcode: '8901030865278',
    healthScore: 8,
    nutritionalInfo: {
      calories: 250,
      protein: 9,
      carbs: 45,
      fat: 3,
      fiber: 4,
      sugar: 3,
      sodium: 200
    },
    ingredients: ['Whole wheat flour', 'Water', 'Yeast', 'Salt', 'Sugar']
  },
  {
    name: 'Low Fat Milk - 1L',
    category: 'dairy',
    price: 50,
    barcode: '8901030865279',
    healthScore: 7,
    nutritionalInfo: {
      calories: 150,
      protein: 8,
      carbs: 12,
      fat: 2,
      fiber: 0,
      sugar: 12,
      sodium: 100
    }
  },
  {
    name: 'Green Tea - 100 Bags',
    category: 'beverages',
    price: 200,
    barcode: '8901030865280',
    healthScore: 9,
    nutritionalInfo: {
      calories: 2,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    }
  },
  {
    name: 'Mixed Nuts - 500g',
    category: 'snacks',
    price: 450,
    barcode: '8901030865281',
    healthScore: 8,
    nutritionalInfo: {
      calories: 600,
      protein: 20,
      carbs: 20,
      fat: 50,
      fiber: 10,
      sugar: 5,
      sodium: 10
    },
    ingredients: ['Almonds', 'Cashews', 'Walnuts', 'Pistachios']
  },
  {
    name: 'Antibacterial Hand Wash',
    category: 'personal_care',
    price: 99,
    barcode: '8901030865282',
    healthScore: 7
  },
  {
    name: 'Dishwashing Liquid - 1L',
    category: 'household',
    price: 150,
    barcode: '8901030865283',
    healthScore: 5
  },
  {
    name: 'Basmati Rice - 5kg',
    category: 'groceries',
    price: 400,
    barcode: '8901030865284',
    healthScore: 6,
    nutritionalInfo: {
      calories: 350,
      protein: 7,
      carbs: 78,
      fat: 0.5,
      fiber: 1,
      sugar: 0,
      sodium: 5
    }
  },
  {
    name: 'Fresh Orange Juice - 1L',
    category: 'beverages',
    price: 120,
    originalPrice: 150,
    barcode: '8901030865285',
    healthScore: 7,
    nutritionalInfo: {
      calories: 450,
      protein: 2,
      carbs: 110,
      fat: 0,
      fiber: 2,
      sugar: 90,
      sodium: 10
    }
  },
  {
    name: 'Dark Chocolate - 100g',
    category: 'snacks',
    price: 150,
    barcode: '8901030865286',
    healthScore: 6,
    nutritionalInfo: {
      calories: 500,
      protein: 5,
      carbs: 60,
      fat: 30,
      fiber: 7,
      sugar: 40,
      sodium: 20
    }
  },
  {
    name: 'Greek Yogurt - 400g',
    category: 'dairy',
    price: 80,
    barcode: '8901030865287',
    healthScore: 9,
    nutritionalInfo: {
      calories: 100,
      protein: 10,
      carbs: 6,
      fat: 4,
      fiber: 0,
      sugar: 4,
      sodium: 80
    }
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Create users
const createUsers = async () => {
  try {
    const users = [];

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartshopping.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true
    });
    users.push(admin);

    // Create test customer
    const customer = await User.create({
      name: 'John Doe',
      email: 'customer@test.com',
      password: 'Customer@123',
      role: 'customer',
      phone: '9876543210',
      isEmailVerified: true,
      preferences: {
        healthGoals: ['lose_weight', 'low_sugar'],
        dietaryRestrictions: ['gluten']
      },
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      }
    });
    users.push(customer);

    // Create test seller
    const seller = await User.create({
      name: 'Smart Mart',
      email: 'seller@test.com',
      password: 'Seller@123',
      role: 'seller',
      phone: '9876543211',
      isEmailVerified: true,
      businessInfo: {
        businessName: 'Smart Mart Superstore',
        gstNumber: '27AAPFU0939F1ZV',
        businessAddress: '456 Market Street, Mumbai',
        businessType: 'retail'
      },
      address: {
        street: '456 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400002',
        country: 'India'
      }
    });
    users.push(seller);

    console.log(`Created ${users.length} users`);
    return { customer, seller, admin };
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
};

// Create products and inventory
const createProducts = async (sellerId) => {
  try {
    const products = [];

    for (const productData of sampleProducts) {
      // Create product
      const product = await Product.create({
        ...productData,
        seller: sellerId,
        stockLevel: Math.floor(Math.random() * 100) + 20,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: productData.category === 'beverages' ? 'l' : 
              productData.name.includes('kg') ? 'kg' : 
              productData.name.includes('g') ? 'g' : 'piece',
        quantity: 1,
        location: {
          aisle: String.fromCharCode(65 + Math.floor(Math.random() * 10)),
          shelf: Math.floor(Math.random() * 5) + 1,
          section: productData.category
        },
        isActive: true,
        images: [{
          url: `/images/products/${productData.barcode}.jpg`,
          isMain: true
        }]
      });

      // Create inventory entry
      const inventory = await Inventory.create({
        product: product._id,
        seller: sellerId,
        stockLevel: product.stockLevel,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel,
        location: product.location,
        lastRestocked: new Date(),
        expiryDate: productData.category === 'dairy' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          : productData.category === 'groceries'
          ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
          : null
      });

      // Check for alerts
      await inventory.checkAlerts();

      products.push(product);
    }

    // Set up product alternatives
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Find alternatives in same category
      const alternatives = products
        .filter(p => p.category === product.category && p._id !== product._id)
        .slice(0, 3)
        .map(alt => ({
          product: alt._id,
          reason: alt.healthScore > product.healthScore ? 'Healthier option' :
                  alt.price < product.price ? 'More affordable' : 'Popular choice',
          type: alt.healthScore > product.healthScore ? 'healthier' :
                alt.price < product.price ? 'cheaper' : 'popular'
        }));

      if (alternatives.length > 0) {
        product.alternatives = alternatives;
        await product.save();
      }
    }

    console.log(`Created ${products.length} products with inventory`);
    return products;
  } catch (error) {
    console.error('Error creating products:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seed...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearData();
    
    // Create users
    const { customer, seller, admin } = await createUsers();
    
    // Create products for seller
    const products = await createProducts(seller._id);
    
    console.log('\nDatabase seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Customer: customer@test.com / Customer@123');
    console.log('Seller: seller@test.com / Seller@123');
    console.log('Admin: admin@smartshopping.com / Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();