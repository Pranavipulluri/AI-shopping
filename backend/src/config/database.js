const mongoose = require('mongoose');
const redis = require('redis');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Create database indexes for better performance
const createIndexes = async () => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Inventory = require('../models/Inventory');

    // Product indexes
    await Product.collection.createIndex({ barcode: 1 }, { unique: true, sparse: true });
    await Product.collection.createIndex({ name: 'text', description: 'text' });
    await Product.collection.createIndex({ category: 1, price: 1 });
    await Product.collection.createIndex({ 'seller': 1 });

    // Order indexes
    await Order.collection.createIndex({ user: 1, createdAt: -1 });
    await Order.collection.createIndex({ status: 1 });

    // Inventory indexes
    await Inventory.collection.createIndex({ product: 1, seller: 1 }, { unique: true });
    await Inventory.collection.createIndex({ expiryDate: 1 });
    await Inventory.collection.createIndex({ stockLevel: 1 });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Redis client setup
let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('Redis Connected'));

    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
    // Continue without Redis (optional caching)
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  const health = {
    mongodb: false,
    redis: false
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.mongodb = true;
    }

    // Check Redis
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.redis = true;
    }
  } catch (error) {
    console.error('Health check error:', error);
  }

  return health;
};

module.exports = {
  connectDB,
  connectRedis,
  redisClient,
  checkDatabaseHealth
};