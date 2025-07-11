Smart Shopping Assistant Platform
A full-stack intelligent shopping assistant that bridges offline and online retail experiences with AI-powered features for customers and sellers.
🚀 Features
Customer Features

AI Shopping Assistant: Chatbot for product recommendations and queries
Smart Product Scanner: Barcode and image-based product identification
Real-time Budget Tracking: Monitor spending against set budgets
Bill Upload & OCR: Automatic bill processing and expense tracking
Spending Analytics: Detailed insights into shopping habits and health metrics
Smart Cart: Intelligent cart with savings tracking and checkout options

Seller Features

Inventory Management: Real-time stock tracking with alerts
Shelf Health Monitoring: AI-powered shelf analysis using computer vision
Predictive Analytics: Demand forecasting and sales predictions
Bulk Import/Export: Excel-based inventory management
Smart Alerts: Low stock, expiry, and overstock notifications
Product Placement Recommendations: AI-driven placement suggestions

🛠️ Tech Stack
Backend

Node.js & Express.js: Server framework
MongoDB: Primary database
Redis: Session management and caching
Socket.io: Real-time notifications
JWT: Authentication
TensorFlow.js: Machine learning
Tesseract.js: OCR processing
OpenAI API: AI chatbot
Google Vision API: Image analysis

Frontend

React 18: UI framework
Tailwind CSS: Styling
React Query: Data fetching and caching
Zustand: State management
Recharts: Analytics visualization
Framer Motion: Animations
Socket.io Client: Real-time updates

📋 Prerequisites

Node.js v16+ and npm
MongoDB 5.0+
Redis 6.0+
Python 3.8+ (for ML services)
Git

🔧 Installation
1. Clone the Repository
bashgit clone https://github.com/yourusername/smart-shopping-platform.git
cd smart-shopping-platform
2. Backend Setup
bashcd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required environment variables:
# - MONGODB_URI
# - JWT_SECRET
# - OPENAI_API_KEY
# - GOOGLE_VISION_API_KEY (optional)
# - STRIPE_SECRET_KEY (for payments)
# - SMTP credentials (for emails)
3. Frontend Setup
bashcd ../frontend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# - REACT_APP_API_URL=http://localhost:5000/api
# - REACT_APP_WEBSOCKET_URL=ws://localhost:5000
4. Database Setup
bash# Start MongoDB
mongod --dbpath /path/to/db

# Start Redis
redis-server

# Seed database (optional)
cd backend
npm run seed
🚀 Running the Application
Development Mode
bash# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
Access the application at:

Frontend: http://localhost:3000
Backend API: http://localhost:5000/api
API Docs: http://localhost:5000/api/docs

Production Mode
bash# Build frontend
cd frontend
npm run build

# Start backend with PM2
cd ../backend
npm install -g pm2
pm2 start ecosystem.config.js
🐳 Docker Deployment
bash# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
📱 API Endpoints
Authentication

POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/auth/profile - Get user profile
PUT /api/auth/profile - Update profile

Products

GET /api/products - List products
GET /api/products/:id - Get product details
POST /api/products/scan - Scan barcode
POST /api/products/scan-image - Scan product image

Cart & Orders

GET /api/cart - Get cart
POST /api/cart/add - Add to cart
PUT /api/cart/update/:id - Update quantity
DELETE /api/cart/remove/:id - Remove item
POST /api/orders/checkout - Checkout

Inventory (Seller)

GET /api/inventory - Get inventory
POST /api/inventory/product - Add product
PUT /api/inventory/product/:id - Update product
DELETE /api/inventory/product/:id - Delete product
POST /api/inventory/import - Import from Excel
GET /api/inventory/export - Export to Excel

Analytics

GET /api/analytics/customer/spending - Spending analytics
GET /api/analytics/customer/insights - Health insights
GET /api/analytics/seller/sales - Sales analytics
GET /api/analytics/seller/predictions - Demand predictions

AI Services

POST /api/ai/chat - Chat with AI assistant
POST /api/ai/ocr - Process bill with OCR
POST /api/ai/image-analysis - Analyze product image

🔐 Security

Authentication: JWT-based with refresh tokens
Rate Limiting: API endpoints are rate-limited
Input Validation: All inputs validated and sanitized
File Upload: Type and size restrictions
HTTPS: SSL/TLS required in production
CORS: Configured for specific origins
Environment Variables: Sensitive data in .env files

📊 Monitoring
Health Check
bashcurl http://localhost:5000/api/health
Logs

Application logs: logs/app.log
Error logs: logs/error.log
Access logs: logs/access.log

PM2 Monitoring
bashpm2 monit
pm2 logs
pm2 status
🧪 Testing
bash# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
🚀 Deployment
Heroku
bash# Install Heroku CLI
heroku create smart-shopping-app
heroku addons:create mongolab
heroku addons:create heroku-redis
git push heroku main
AWS EC2

Launch Ubuntu 20.04 instance
Install Node.js, MongoDB, Redis, Nginx
Clone repository
Configure PM2 for process management
Setup Nginx as reverse proxy
Configure SSL with Let's Encrypt

Digital Ocean
bash# Use provided one-click apps
# Or follow manual setup similar to AWS
📝 Environment Variables
Backend (.env)
env# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-shopping
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# External APIs
OPENAI_API_KEY=your-openai-key
GOOGLE_VISION_API_KEY=your-google-vision-key
STRIPE_SECRET_KEY=your-stripe-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000
Frontend (.env)
envREACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
REACT_APP_GOOGLE_MAPS_KEY=your-google-maps-key
🤝 Contributing

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
