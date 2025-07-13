import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});



// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }
};

// Product APIs
export const productAPI = {
  getProducts: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  scanBarcode: async (barcode) => {
    const response = await api.post('/products/scan', { barcode });
    return response.data;
  },
  
  scanProductImage: async (formData) => {
    const response = await api.post('/products/scan-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  getRecommendations: async (productId) => {
    const response = await api.get(`/products/recommendations/${productId}`);
    return response.data;
  }
};

// Cart APIs
export const cartAPI = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  addToCart: async (data) => {
    const response = await api.post('/cart/add', data);
    return response.data;
  },
  
  updateCartItem: async (itemId, data) => {
    const response = await api.put(`/cart/update/${itemId}`, data);
    return response.data;
  },
  
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/remove/${itemId}`);
    return response.data;
  },
  
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
  
  checkout: async (data) => {
    const response = await api.post('/orders/checkout', data);
    return response.data;
  }
};

// AI/Chat APIs
export const aiAPI = {
  sendChatMessage: async (data) => {
    const response = await api.post('/ai/chat', data);
    return response.data;
  },
  
  processBillOCR: async (formData) => {
    const response = await api.post('/ai/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Analytics APIs
export const analyticsAPI = {
  getSpendingAnalytics: async (params) => {
    const response = await api.get('/analytics/customer/spending', { params });
    return response.data;
  },
  
  getHealthInsights: async () => {
    const response = await api.get('/analytics/customer/insights');
    return response.data;
  },
  
  getSalesAnalytics: async (params) => {
    const response = await api.get('/analytics/seller/sales', { params });
    return response.data;
  },
  
  getRecentOrders: async () => {
    const response = await api.get('/analytics/customer/recent-orders');
    return response.data;
},

  getDemandPredictions: async () => {
    const response = await api.get('/analytics/seller/predictions');
    return response.data;
  }
};

// Inventory APIs (Seller)
export const inventoryAPI = {
  getInventory: async (params) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },
  
  addProduct: async (data) => {
    const response = await api.post('/inventory/product', data);
    return response.data;
  },
  
  updateProduct: async (id, data) => {
    const response = await api.put(`/inventory/product/${id}`, data);
    return response.data;
  },
  
  deleteProduct: async (id) => {
    const response = await api.delete(`/inventory/product/${id}`);
    return response.data;
  },
  
  importProducts: async (data) => {
    const response = await api.post('/inventory/import', { products: data });
    return response.data;
  },
  
  exportInventory: async () => {
    const response = await api.get('/inventory/export');
    return response.data;
  },
  
  analyzeShelfImage: async (formData) => {
    const response = await api.post('/inventory/shelf-analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};


export const checkout = async (cart) => {
    // your logic
};


// Export all APIs
export {
  authAPI as auth,
  productAPI as products,
  cartAPI as cart,
  aiAPI as ai,
  analyticsAPI as analytics,
  inventoryAPI as inventory
};

// Export specific functions for convenience
export const login = authAPI.login;
export const register = authAPI.register;
export const getCart = cartAPI.getCart;
export const addToCart = cartAPI.addToCart;
export const scanBarcode = productAPI.scanBarcode;
export const scanProductImage = productAPI.scanProductImage;
export const sendChatMessage = aiAPI.sendChatMessage;
export const processBillOCR = aiAPI.processBillOCR;
export const getSpendingAnalytics = analyticsAPI.getSpendingAnalytics;
export const getHealthInsights = analyticsAPI.getHealthInsights;
export const getInventory = inventoryAPI.getInventory;
export const updateProduct = inventoryAPI.updateProduct;
export const deleteProduct = inventoryAPI.deleteProduct;
export const importProducts = inventoryAPI.importProducts;
export const exportInventory = inventoryAPI.exportInventory;
export const analyzeShelfImage = inventoryAPI.analyzeShelfImage;
export const uploadBill = cartAPI.checkout; // Reusing checkout for bill upload
export const generateQRCode = cartAPI.checkout; // Reusing checkout for QR generation
