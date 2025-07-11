import React, { createContext, useState, useContext, useEffect } from 'react';
import { cart as cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user changes
  useEffect(() => {
    if (user && user.role === 'customer') {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      setCart(response.cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartAPI.addToCart({ productId, quantity });
      
      if (response.success) {
        setCart(response.cart);
        toast.success('Added to cart');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to add to cart');
      return { success: false };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(itemId, { quantity });
      
      if (response.success) {
        setCart(response.cart);
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update quantity');
      return { success: false };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      
      if (response.success) {
        setCart(response.cart);
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to remove item');
      return { success: false };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      
      if (response.success) {
        setCart({ items: [], totalAmount: 0, totalItems: 0 });
        toast.success('Cart cleared');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to clear cart');
      return { success: false };
    }
  };

  const refreshCart = () => {
    fetchCart();
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}