module.exports = {
  // User roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    ADMIN: 'admin'
  },

  // Order status
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Product categories
  PRODUCT_CATEGORIES: [
    'groceries',
    'dairy',
    'beverages',
    'snacks',
    'personal_care',
    'household',
    'electronics',
    'clothing',
    'health',
    'baby_care',
    'pet_supplies',
    'other'
  ],

  // Units
  PRODUCT_UNITS: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen'],

  // Alert types
  ALERT_TYPES: {
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    EXPIRING_SOON: 'expiring_soon',
    EXPIRED: 'expired',
    OVERSTOCK: 'overstock'
  },

  // Alert severity
  ALERT_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Analytics event types
  ANALYTICS_EVENTS: {
    SALE: 'sale',
    VIEW: 'view',
    SEARCH: 'search',
    CART_ADD: 'cart_add',
    CART_REMOVE: 'cart_remove'
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // File upload limits
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    ALLOWED_DOCUMENT_TYPES: ['pdf', 'xlsx', 'xls', 'csv']
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    PRODUCTS: 300, // 5 minutes
    CATEGORIES: 3600, // 1 hour
    USER_PROFILE: 600, // 10 minutes
    ANALYTICS: 300 // 5 minutes
  },

  // Notification types
  NOTIFICATION_TYPES: {
    INVENTORY_ALERT: 'inventory_alert',
    ORDER_UPDATE: 'order_update',
    PROMOTION: 'promotion',
    SYSTEM: 'system'
  },

  // Health score thresholds
  HEALTH_SCORE: {
    EXCELLENT: 8,
    GOOD: 6,
    AVERAGE: 4,
    POOR: 2
  },

  // Regex patterns
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[6-9]\d{9}$/,
    BARCODE: /^[0-9]{8,14}$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  }
};