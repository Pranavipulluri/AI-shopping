const Product = require('../models/Product');
const { AIService, ImageAnalysisService } = require('../services/aiService');
const Quagga = require('quagga');
const sharp = require('sharp');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    // Get total count
    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalProducts: count
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('alternatives.product', 'name price healthScore images');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// @desc    Scan barcode
// @route   POST /api/products/scan
// @access  Private
exports.scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;

    // Find product by barcode
    const product = await Product.findOne({ barcode, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get alternatives
    const alternatives = await Product.findAlternatives(product._id);

    // Generate AI insights
    const insights = await AIService.generateProductInsights(product);

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        insights: insights?.insights
      },
      alternatives
    });
  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan barcode'
    });
  }
};

// @desc    Scan product image
// @route   POST /api/products/scan-image
// @access  Private
exports.scanProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Process image
    const processedImage = await sharp(req.file.path)
      .resize(800, 800, { fit: 'inside' })
      .toBuffer();

    // Try barcode detection first
    let barcode = null;
    try {
      barcode = await detectBarcode(processedImage);
    } catch (error) {
      console.log('No barcode detected in image');
    }

    let product = null;

    if (barcode) {
      // Find product by barcode
      product = await Product.findOne({ barcode, isActive: true });
    }

    if (!product) {
      // Use image recognition to identify product
      // This is a simplified version - in production, you'd use
      // a proper image recognition service
      const imageFeatures = await ImageAnalysisService.extractFeatures(processedImage);
      
      // Find similar products based on image features
      product = await Product.findOne({
        isActive: true
        // Add image similarity matching here
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Could not identify product from image'
      });
    }

    // Get alternatives
    const alternatives = await Product.findAlternatives(product._id);

    // Generate AI insights
    const insights = await AIService.generateProductInsights(product);

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        insights: insights?.insights
      },
      alternatives
    });
  } catch (error) {
    console.error('Scan image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process image'
    });
  }
};

// @desc    Get product recommendations
// @route   GET /api/products/recommendations/:id
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Get user preferences
    const userPreferences = req.user.preferences || {};
    
    // Get healthier alternatives
    const healthier = await Product.findAlternatives(productId, 'healthier');
    
    // Get cheaper alternatives
    const cheaper = await Product.findAlternatives(productId, 'cheaper');
    
    // Get popular alternatives
    const popular = await Product.findAlternatives(productId, 'popular');
    
    // Get personalized recommendations based on user preferences
    const personalized = await getPersonalizedRecommendations(
      productId, 
      userPreferences
    );

    res.status(200).json({
      success: true,
      recommendations: {
        healthier,
        cheaper,
        popular,
        personalized
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

// Helper function to detect barcode
async function detectBarcode(imageBuffer) {
  return new Promise((resolve, reject) => {
    // This is a placeholder - implement actual barcode detection
    // using a library like dynamsoft-javascript-barcode
    resolve(null);
  });
}

// Helper function for personalized recommendations
async function getPersonalizedRecommendations(productId, preferences) {
  const product = await Product.findById(productId);
  if (!product) return [];

  const query = {
    _id: { $ne: productId },
    category: product.category,
    isActive: true
  };

  // Apply dietary restrictions
  if (preferences.dietaryRestrictions?.length > 0) {
    query.allergens = { $nin: preferences.dietaryRestrictions };
  }

  // Apply health goals
  if (preferences.healthGoals?.includes('low-sugar')) {
    query['nutritionalInfo.sugar'] = { $lt: 10 };
  }
  if (preferences.healthGoals?.includes('high-protein')) {
    query['nutritionalInfo.protein'] = { $gt: 10 };
  }

  return await Product.find(query)
    .sort({ healthScore: -1, rating: -1 })
    .limit(3)
    .select('name price healthScore images category');
}
