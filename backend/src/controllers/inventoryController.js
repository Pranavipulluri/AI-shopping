const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { validationResult } = require('express-validator');
const { ImageAnalysisService } = require('../services/aiService');
const XLSX = require('xlsx');
const fs = require('fs').promises;

// @desc    Get seller inventory
// @route   GET /api/inventory
// @access  Private (Seller)
exports.getInventory = async (req, res) => {
  try {
    const {
      search,
      category,
      lowStock,
      expiringSoon,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { seller: req.user.id, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: search }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }
    ];

    // Add filters
    if (lowStock) {
      pipeline.push({
        $match: {
          $expr: { $lte: ['$stockLevel', '$minStockLevel'] }
        }
      });
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      pipeline.push({
        $match: {
          expiryDate: { $lte: thirtyDaysFromNow }
        }
      });
    }

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    const inventory = await Inventory.aggregate(pipeline);

    // Get total count
    const totalCount = await Inventory.countDocuments(query);

    // Get alerts count
    const alertsCount = await getAlertsCount(req.user.id);

    res.status(200).json({
      success: true,
      products: inventory,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalProducts: totalCount,
      alerts: alertsCount
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
};

// @desc    Add new product to inventory
// @route   POST /api/inventory/product
// @access  Private (Seller)
exports.addProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      seller: req.user.id
    };

    // Handle image upload
    if (req.file) {
      productData.images = [{
        url: `/uploads/products/${req.file.filename}`,
        isMain: true
      }];
    }

    // Create product
    const product = await Product.create(productData);

    // Create inventory entry
    const inventory = await Inventory.create({
      product: product._id,
      seller: req.user.id,
      stockLevel: productData.stockLevel || 0,
      minStockLevel: productData.minStockLevel || 10,
      maxStockLevel: productData.maxStockLevel || 100,
      location: productData.location,
      expiryDate: productData.expiryDate
    });

    res.status(201).json({
      success: true,
      product,
      inventory,
      message: 'Product added successfully'
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/inventory/product/:id
// @access  Private (Seller)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find product and verify ownership
    const product = await Product.findOne({ _id: id, seller: req.user.id });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    Object.assign(product, updates);
    await product.save();

    // Update inventory if stock levels changed
    if (updates.stockLevel !== undefined) {
      await Inventory.findOneAndUpdate(
        { product: id, seller: req.user.id },
        { 
          stockLevel: updates.stockLevel,
          lastUpdated: Date.now()
        }
      );
    }

    res.status(200).json({
      success: true,
      product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/inventory/product/:id
// @access  Private (Seller)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete product
    const product = await Product.findOneAndUpdate(
      { _id: id, seller: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete inventory entry
    await Inventory.findOneAndUpdate(
      { product: id, seller: req.user.id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// @desc    Import products from Excel
// @route   POST /api/inventory/import
// @access  Private (Seller)
exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (const row of data) {
      try {
        const productData = {
          name: row['Product Name'] || row.name,
          category: row['Category'] || row.category || 'other',
          price: parseFloat(row['Price'] || row.price || 0),
          barcode: row['Barcode'] || row.barcode,
          stockLevel: parseInt(row['Stock'] || row.stock || 0),
          minStockLevel: parseInt(row['Min Stock'] || row.minStock || 10),
          maxStockLevel: parseInt(row['Max Stock'] || row.maxStock || 100),
          seller: req.user.id
        };

        // Create or update product
        const product = await Product.findOneAndUpdate(
          { barcode: productData.barcode, seller: req.user.id },
          productData,
          { upsert: true, new: true }
        );

        // Update inventory
        await Inventory.findOneAndUpdate(
          { product: product._id, seller: req.user.id },
          {
            stockLevel: productData.stockLevel,
            minStockLevel: productData.minStockLevel,
            maxStockLevel: productData.maxStockLevel
          },
          { upsert: true }
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: row['Product Name'] || 'Unknown',
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.status(200).json({
      success: true,
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      count: results.success,
      results
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import products'
    });
  }
};

// @desc    Export inventory to Excel
// @route   GET /api/inventory/export
// @access  Private (Seller)
exports.exportInventory = async (req, res) => {
  try {
    // Get all products with inventory data
    const inventory = await Inventory.find({ 
      seller: req.user.id, 
      isActive: true 
    }).populate('product');

    // Transform data for Excel
    const data = inventory.map(item => ({
      'Product Name': item.product.name,
      'Category': item.product.category,
      'Barcode': item.product.barcode || '',
      'Price': item.product.price,
      'Stock': item.stockLevel,
      'Min Stock': item.minStockLevel,
      'Max Stock': item.maxStockLevel,
      'Location': item.location ? `${item.location.aisle}-${item.location.shelf}` : '',
      'Expiry Date': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '',
      'Status': item.stockLevel <= item.minStockLevel ? 'Low Stock' : 'In Stock'
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export inventory'
    });
  }
};

// @desc    Analyze shelf image
// @route   POST /api/inventory/shelf-analysis
// @access  Private (Seller)
exports.analyzeShelf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Analyze shelf image
    const analysis = await ImageAnalysisService.analyzeShelfImage(req.file.path);

    if (!analysis.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to analyze shelf image'
      });
    }

    // Generate recommendations based on analysis
    const recommendations = await generateShelfRecommendations(
      analysis.analysis,
      req.user.id
    );

    res.status(200).json({
      success: true,
      analysis: analysis.analysis,
      recommendations,
      message: 'Shelf analysis completed'
    });
  } catch (error) {
    console.error('Shelf analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze shelf'
    });
  }
};

// @desc    Get inventory alerts
// @route   GET /api/inventory/alerts
// @access  Private (Seller)
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await generateInventoryAlerts(req.user.id);

    res.status(200).json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
};

// Helper functions
async function getAlertsCount(sellerId) {
  const alerts = await generateInventoryAlerts(sellerId);
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.priority === 'high').length,
    warning: alerts.filter(a => a.priority === 'medium').length
  };
}

async function generateInventoryAlerts(sellerId) {
  const alerts = [];

  // Low stock alerts
  const lowStockItems = await Inventory.find({
    seller: sellerId,
    isActive: true,
    $expr: { $lte: ['$stockLevel', '$minStockLevel'] }
  }).populate('product', 'name category');

  lowStockItems.forEach(item => {
    alerts.push({
      type: 'low_stock',
      priority: item.stockLevel === 0 ? 'high' : 'medium',
      product: item.product.name,
      message: `${item.product.name} is ${item.stockLevel === 0 ? 'out of stock' : 'low on stock'} (${item.stockLevel} units)`,
      data: {
        productId: item.product._id,
        currentStock: item.stockLevel,
        minStock: item.minStockLevel
      }
    });
  });

  // Expiry alerts
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringItems = await Inventory.find({
    seller: sellerId,
    isActive: true,
    expiryDate: { $lte: thirtyDaysFromNow }
  }).populate('product', 'name');

  expiringItems.forEach(item => {
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    alerts.push({
      type: 'expiry',
      priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
      product: item.product.name,
      message: `${item.product.name} ${daysUntilExpiry <= 0 ? 'has expired' : `expires in ${daysUntilExpiry} days`}`,
      data: {
        productId: item.product._id,
        expiryDate: item.expiryDate,
        daysUntilExpiry
      }
    });
  });

  // Overstock alerts
  const overstockItems = await Inventory.find({
    seller: sellerId,
    isActive: true,
    $expr: { $gte: ['$stockLevel', { $multiply: ['$maxStockLevel', 0.9] }] }
  }).populate('product', 'name');

  overstockItems.forEach(item => {
    alerts.push({
      type: 'overstock',
      priority: 'low',
      product: item.product.name,
      message: `${item.product.name} is overstocked (${item.stockLevel}/${item.maxStockLevel} units)`,
      data: {
        productId: item.product._id,
        currentStock: item.stockLevel,
        maxStock: item.maxStockLevel
      }
    });
  });

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

async function generateShelfRecommendations(analysis, sellerId) {
  const recommendations = [];

  if (analysis.isEmpty) {
    recommendations.push({
      action: 'restock',
      priority: 'high',
      message: 'Shelf is empty and needs immediate restocking'
    });
  }

  if (analysis.isMessy) {
    recommendations.push({
      action: 'organize',
      priority: 'medium',
      message: 'Shelf needs reorganization for better presentation'
    });
  }

  // Check empty zones
  const emptyZones = analysis.zones.filter(z => z.isEmpty);
  if (emptyZones.length > 0) {
    recommendations.push({
      action: 'fill_zones',
      priority: 'medium',
      message: `${emptyZones.length} empty zones detected that need products`,
      zones: emptyZones
    });
  }

  return recommendations;
}