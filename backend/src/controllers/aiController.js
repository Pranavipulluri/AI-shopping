const { AIService, OCRService, ImageAnalysisService } = require('../services/aiService');
const { validationResult } = require('express-validator');
const Analytics = require('../models/Analytics');

// @desc    Chat with AI bot
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithBot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { message, context } = req.body;
    
    // Add user context
    const enrichedContext = {
      ...context,
      userId: req.user.id,
      userName: req.user.name,
      userPreferences: req.user.preferences
    };

    // Get AI response
    const response = await AIService.chatWithBot(message, enrichedContext);

    // Record analytics
    await Analytics.recordEvent({
      type: 'chat',
      user: req.user.id,
      metadata: {
        message: message.substring(0, 100), // Store first 100 chars
        responseLength: response.message?.length
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
};

// @desc    Process bill with OCR
// @route   POST /api/ai/ocr
// @access  Private
exports.processBillOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No bill image provided'
      });
    }

    // Process bill image
    const result = await OCRService.processBillImage(req.file.path);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to process bill image'
      });
    }

    // Clean up file after processing
    const fs = require('fs').promises;
    await fs.unlink(req.file.path);

    res.status(200).json({
      success: true,
      data: result.data,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bill'
    });
  }
};

// @desc    Analyze product image
// @route   POST /api/ai/image-analysis
// @access  Private
exports.analyzeProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    const productData = req.body;
    
    // Analyze image for product placement
    const analysis = await ImageAnalysisService.analyzeProductPlacement(
      req.file.path,
      productData
    );

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze image'
    });
  }
};

// @desc    Scan barcode from image
// @route   POST /api/ai/barcode
// @access  Private
exports.scanBarcode = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Process barcode - implementation would use a barcode library
    // This is a placeholder
    const barcode = await detectBarcodeFromImage(req.file.path);

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: 'No barcode detected in image'
      });
    }

    res.status(200).json({
      success: true,
      barcode
    });
  } catch (error) {
    console.error('Barcode scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan barcode'
    });
  }
};

// @desc    Get health-based recommendations
// @route   POST /api/ai/health-recommendations
// @access  Private
exports.getHealthRecommendations = async (req, res) => {
  try {
    const { healthGoals, dietaryRestrictions } = req.body;
    
    // Get user's purchase history
    const Order = require('../models/Order');
    const recentOrders = await Order.find({
      user: req.user.id,
      status: 'completed'
    })
    .populate('items.product')
    .sort('-createdAt')
    .limit(10);

    // Analyze purchase patterns
    const purchasePatterns = analyzePurchasePatterns(recentOrders);

    // Generate personalized recommendations
    const recommendations = await AIService.generateHealthRecommendations({
      healthGoals,
      dietaryRestrictions,
      purchasePatterns,
      userPreferences: req.user.preferences
    });

    res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Health recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};

// Helper functions
async function detectBarcodeFromImage(imagePath) {
  // Placeholder - would use actual barcode detection library
  return null;
}

function analyzePurchasePatterns(orders) {
  const patterns = {
    categories: {},
    healthScores: [],
    totalSpent: 0
  };

  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.product) {
        // Count categories
        const category = item.product.category;
        patterns.categories[category] = (patterns.categories[category] || 0) + item.quantity;
        
        // Track health scores
        if (item.product.healthScore) {
          patterns.healthScores.push(item.product.healthScore);
        }
        
        // Calculate total spent
        patterns.totalSpent += item.price * item.quantity;
      }
    });
  });

  // Calculate average health score
  patterns.averageHealthScore = patterns.healthScores.length > 0
    ? patterns.healthScores.reduce((a, b) => a + b, 0) / patterns.healthScores.length
    : 0;

  return patterns;
}