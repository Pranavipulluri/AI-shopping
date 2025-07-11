import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, QrCode, TrendingUp, Package, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Context & Services
import { useCart } from '../../context/CartContext';
import { checkout, generateQRCode } from '../../services/api';

export default function SmartCart() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const [checkoutMode, setCheckoutMode] = useState('online'); // 'online' or 'store'
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(localStorage.getItem('budgetLimit') || '');

  // Calculate budget progress
  const budgetProgress = budgetLimit ? (cart.totalAmount / parseFloat(budgetLimit)) * 100 : 0;
  const isOverBudget = budgetProgress > 100;

  // Handle quantity update
  const handleQuantityUpdate = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    await updateQuantity(itemId, newQuantity);
  };

  // Handle item removal
  const handleRemoveItem = async (itemId) => {
    await removeItem(itemId);
    toast.success('Item removed from cart');
  };

  // Handle checkout
  const handleCheckout = async () => {
    setLoading(true);

    try {
      if (checkoutMode === 'online') {
        const response = await checkout({
          items: cart.items,
          paymentMethod: 'online'
        });
        
        if (response.success) {
          toast.success('Order placed successfully!');
          clearCart();
          navigate('/customer/orders/' + response.orderId);
        }
      } else {
        // Generate QR code for in-store payment
        const response = await generateQRCode({
          cartId: cart._id,
          amount: cart.totalAmount
        });
        
        setQrCode(response.qrCode);
      }
    } catch (error) {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save budget limit
  useEffect(() => {
    if (budgetLimit) {
      localStorage.setItem('budgetLimit', budgetLimit);
    }
  }, [budgetLimit]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Start shopping to add items to your cart</p>
          <Link
            to="/customer/scan"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Shopping Cart ({cart.totalItems} items)
              </h1>
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Clear Cart
              </button>
            </div>

            {/* Budget Tracker */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Budget Limit</label>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="Set budget"
                  className="w-32 px-3 py-1 border rounded-lg text-sm"
                />
              </div>
              
              {budgetLimit && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    />
                  </div>
                  <p className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                    {isOverBudget 
                      ? `Over budget by ₹${(cart.totalAmount - parseFloat(budgetLimit)).toFixed(2)}`
                      : `₹${(parseFloat(budgetLimit) - cart.totalAmount).toFixed(2)} remaining`
                    }
                  </p>
                </>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <img
                      src={item.product.images?.[0]?.url || '/api/placeholder/80/80'}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.category}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-indigo-600">₹{item.price}</span>
                        {item.product.originalPrice > item.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{item.product.originalPrice}
                            </span>
                            <span className="text-sm text-green-600">
                              Save ₹{(item.product.originalPrice - item.price) * item.quantity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityUpdate(item._id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityUpdate(item._id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-red-500 hover:text-red-700 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{(cart.totalAmount + cart.savings).toFixed(2)}</span>
              </div>
              
              {cart.savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Total Savings
                  </span>
                  <span>-₹{cart.savings.toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCheckoutMode('online')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    checkoutMode === 'online'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm">Pay Online</span>
                </button>
                
                <button
                  onClick={() => setCheckoutMode('store')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    checkoutMode === 'store'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm">Pay at Store</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || (budgetLimit && isOverBudget)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                loading || (budgetLimit && isOverBudget)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>
            
            {budgetLimit && isOverBudget && (
              <p className="text-red-600 text-sm mt-2 text-center">
                Cannot checkout - over budget limit
              </p>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setQrCode(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Scan to Pay at Store</h3>
                <button
                  onClick={() => setQrCode(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <img src={qrCode} alt="Payment QR Code" className="w-full" />
              </div>
              
              <p className="text-center text-gray-600">
                Show this QR code at the checkout counter
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
