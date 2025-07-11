const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const cartController = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/auth');

// All cart routes require authentication as customer
router.use(protect);
router.use(authorize('customer'));

router.get('/', cartController.getCart);

router.post('/add',
  [
    body('productId').notEmpty().isMongoId(),
    body('quantity').optional().isInt({ min: 1 })
  ],
  cartController.addToCart
);

router.put('/update/:itemId',
  [
    param('itemId').isMongoId(),
    body('quantity').isInt({ min: 1 })
  ],
  cartController.updateCartItem
);

router.delete('/remove/:itemId',
  [param('itemId').isMongoId()],
  cartController.removeFromCart
);

router.delete('/clear', cartController.clearCart);

module.exports = router;
