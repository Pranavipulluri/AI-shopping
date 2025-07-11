const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// All inventory routes require seller authentication
router.use(protect);
router.use(authorize('seller', 'admin'));

// Get inventory with filters
router.get('/',
  [
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('lowStock').optional().isBoolean(),
    query('expiringSoon').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  inventoryController.getInventory
);

// Add new product
router.post('/product',
  upload.single('productImage'),
  [
    body('name').notEmpty().trim(),
    body('category').notEmpty().isIn(['groceries', 'dairy', 'beverages', 'snacks', 'household']),
    body('price').isFloat({ min: 0 }),
    body('stockLevel').isInt({ min: 0 }),
    body('barcode').optional().isString()
  ],
  inventoryController.addProduct
);

// Update product
router.put('/product/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('stockLevel').optional().isInt({ min: 0 })
  ],
  inventoryController.updateProduct
);

// Delete product
router.delete('/product/:id',
  [param('id').isMongoId()],
  inventoryController.deleteProduct
);

// Import products from Excel
router.post('/import',
  upload.single('file'),
  inventoryController.importProducts
);

// Export inventory to Excel
router.get('/export',
  inventoryController.exportInventory
);

// Analyze shelf image
router.post('/shelf-analysis',
  upload.single('shelfImage'),
  inventoryController.analyzeShelf
);

// Get inventory alerts
router.get('/alerts',
  inventoryController.getAlerts
);

module.exports = router;