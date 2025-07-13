export const CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'household', label: 'Household' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'health', label: 'Health' },
  { value: 'baby_care', label: 'Baby Care' },
  { value: 'pet_supplies', label: 'Pet Supplies' },
  { value: 'other', label: 'Other' }
];

export const HEALTH_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'gain_muscle', label: 'Gain Muscle' },
  { value: 'low_sugar', label: 'Reduce Sugar Intake' },
  { value: 'high_protein', label: 'Increase Protein' },
  { value: 'low_carb', label: 'Low Carb Diet' },
  { value: 'vegan', label: 'Vegan Diet' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'heart_healthy', label: 'Heart Healthy' }
];

export const DIETARY_RESTRICTIONS = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'fish', label: 'Fish' },
  { value: 'vegetarian', label: 'Meat Products' },
  { value: 'vegan', label: 'Animal Products' }
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout'
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/:id',
    SCAN: '/products/scan',
    SCAN_IMAGE: '/products/scan-image',
    RECOMMENDATIONS: '/products/recommendations/:id'
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update/:id',
    REMOVE: '/cart/remove/:id',
    CLEAR: '/cart/clear'
  },
  ORDERS: {
    CHECKOUT: '/orders/checkout',
    LIST: '/orders',
    DETAIL: '/orders/:id'
  },
  INVENTORY: {
    LIST: '/inventory',
    PRODUCT: '/inventory/product',
    IMPORT: '/inventory/import',
    EXPORT: '/inventory/export',
    SHELF_ANALYSIS: '/inventory/shelf-analysis',
    ALERTS: '/inventory/alerts'
  },
  ANALYTICS: {
    CUSTOMER_SPENDING: '/analytics/customer/spending',
    HEALTH_INSIGHTS: '/analytics/customer/insights',
    SALES: '/analytics/seller/sales',
    PREDICTIONS: '/analytics/seller/predictions'
  },
  AI: {
    CHAT: '/ai/chat',
    OCR: '/ai/ocr',
    IMAGE_ANALYSIS: '/ai/image-analysis',
    BARCODE: '/ai/barcode'
  }
};

export const PRODUCT_UNITS = [
  'kg',
  'litre',
  'piece',
  'dozen',
  'packet',
  'grams',
  'millilitres',
  'bundle',
  'set',
  'box'
];