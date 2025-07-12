const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
  ),
  
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'Too many authentication attempts, please try again later.'
  ),
  
  upload: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    20, // limit each IP to 20 uploads per hour
    'Upload limit exceeded, please try again later.'
  ),
  
  ai: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    50, // limit each IP to 50 AI requests per hour
    'AI service limit exceeded, please try again later.'
  )
};

// Security middleware
const securityMiddleware = (app) => {
  // Enable trust proxy
  app.set('trust proxy', 1);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Sanitize data
  app.use(mongoSanitize()); // Prevent MongoDB injection
  app.use(xss()); // Clean user input from malicious HTML
  
  // Prevent parameter pollution
  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'price']
  }));
  
  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
};

module.exports = {
  securityMiddleware,
  rateLimiters,
  corsOptions
};