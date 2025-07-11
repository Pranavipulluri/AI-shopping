const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router.use(protect);

// AI Chat endpoint
router.post('/chat',
  [
    body('message').notEmpty().isString(),
    body('context').optional().isObject()
  ],
  aiController.chatWithBot
);

// OCR endpoint for bill processing
router.post('/ocr',
  upload.single('bill'),
  aiController.processBillOCR
);

// Product image analysis
router.post('/image-analysis',
  upload.single('image'),
  aiController.analyzeProductImage
);

// Barcode scanning
router.post('/barcode',
  upload.single('image'),
  aiController.scanBarcode
);

// Get product recommendations based on health goals
router.post('/health-recommendations',
  [
    body('healthGoals').isArray(),
    body('dietaryRestrictions').optional().isArray()
  ],
  aiController.getHealthRecommendations
);

module.exports = router;