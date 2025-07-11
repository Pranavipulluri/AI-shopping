const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

// Public routes
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('search').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 })
  ],
  productController.getProducts
);

router.get('/:id',
  [param('id').isMongoId()],
  productController.getProduct
);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/scan',
  [body('barcode').notEmpty().isString()],
  productController.scanBarcode
);

router.post('/scan-image',
  upload.single('image'),
  productController.scanProductImage
);

router.get('/recommendations/:id',
  [param('id').isMongoId()],
  productController.getRecommendations
);

module.exports = router;