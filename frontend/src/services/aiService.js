class AIService {
  constructor() {
    // Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = require('openai');
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.isConfigured = true;
      } catch (error) {
        console.error('Failed to initialize OpenAI:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('OpenAI API key not configured. Using mock responses.');
      this.isConfigured = false;
    }
  }

  async chatWithBot(message, context = {}) {
    try {
      if (!this.isConfigured) {
        // Return mock response if OpenAI is not configured
        return this.getMockResponse(message, context);
      }

      const systemPrompt = `You are a helpful shopping assistant for a smart retail store. 
      You can help customers with:
      - Product recommendations based on their needs
      - Finding healthier alternatives
      - Budget-friendly options
      - Answering product-related questions
      - Dietary restrictions and health goals
      
      Context: ${JSON.stringify(context)}
      
      Be concise, friendly, and helpful. If asked about specific products, provide alternatives based on health, price, and popularity.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return {
        success: true,
        message: response.choices[0].message.content,
        suggestions: await this.extractProductSuggestions(response.choices[0].message.content)
      };
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback to mock response on error
      return this.getMockResponse(message, context);
    }
  }

  // Mock response generator for development/testing
  getMockResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    let response = '';
    let suggestions = [];
    let nextSuggestions = [];

    // Pattern matching for common queries
    if (lowerMessage.includes('healthy') || lowerMessage.includes('health')) {
      response = "I'd be happy to help you find healthy options! Here are some great choices:\n\n" +
                "• Fresh fruits and vegetables - packed with vitamins and minerals\n" +
                "• Whole grain products - better for sustained energy\n" +
                "• Greek yogurt - high in protein and probiotics\n" +
                "• Nuts and seeds - healthy fats and protein\n\n" +
                "Would you like recommendations for a specific category?";
      
      suggestions = ['Fresh Vegetables', 'Whole Wheat Bread', 'Greek Yogurt', 'Mixed Nuts'];
      nextSuggestions = ['Show me healthy breakfast options', 'What about low-sugar snacks?', 'Recommend protein-rich foods'];
    
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      response = "Looking for budget-friendly options? Here are some great value products:\n\n" +
                "• Rice and lentils - nutritious and economical\n" +
                "• Seasonal vegetables - fresh and affordable\n" +
                "• Store brand products - same quality, lower price\n" +
                "• Bulk items - save more when you buy in quantity\n\n" +
                "What's your budget range?";
      
      suggestions = ['Basmati Rice 5kg', 'Seasonal Vegetables', 'Store Brand Items'];
      nextSuggestions = ['Show products under ₹50', 'Best deals this week', 'Bulk buying options'];
    
    } else if (lowerMessage.includes('breakfast')) {
      response = "Here are some nutritious breakfast options:\n\n" +
                "• Oatmeal - high in fiber and customizable\n" +
                "• Whole wheat bread with peanut butter\n" +
                "• Greek yogurt with fruits\n" +
                "• Eggs - versatile and protein-rich\n\n" +
                "Any dietary preferences I should consider?";
      
      suggestions = ['Oatmeal', 'Whole Wheat Bread', 'Greek Yogurt', 'Eggs'];
      nextSuggestions = ['Quick breakfast ideas', 'High-protein breakfast', 'Diabetic-friendly options'];
    
    } else if (lowerMessage.includes('snack')) {
      response = "Here are some healthy snack options:\n\n" +
                "• Mixed nuts - protein and healthy fats\n" +
                "• Fresh fruits - natural sweetness\n" +
                "• Yogurt - probiotics for gut health\n" +
                "• Whole grain crackers - fiber-rich\n\n" +
                "Are you looking for sweet or savory snacks?";
      
      suggestions = ['Mixed Nuts', 'Fresh Fruits', 'Yogurt', 'Whole Grain Crackers'];
      nextSuggestions = ['Low-calorie snacks', 'Kids-friendly snacks', 'Office snacks'];
    
    } else if (lowerMessage.includes('gluten') || lowerMessage.includes('dairy') || lowerMessage.includes('vegan')) {
      response = "I understand you have dietary restrictions. Here are suitable options:\n\n" +
                "• Gluten-free: Rice products, quinoa, fresh produce\n" +
                "• Dairy-free: Almond milk, coconut yogurt, soy products\n" +
                "• Vegan: Plant-based proteins, nuts, vegetables\n\n" +
                "Which specific restriction should I focus on?";
      
      suggestions = ['Gluten-Free Products', 'Dairy-Free Milk', 'Vegan Options'];
      nextSuggestions = ['Show all gluten-free items', 'Dairy alternatives', 'Plant-based proteins'];
    
    } else {
      response = "I'm here to help you with your shopping needs! I can assist with:\n\n" +
                "• Finding healthy alternatives to your favorite products\n" +
                "• Suggesting budget-friendly options\n" +
                "• Recommending products based on dietary restrictions\n" +
                "• Answering questions about products in our store\n\n" +
                "What would you like help with today?";
      
      nextSuggestions = ['Show me healthy snacks', 'What are budget-friendly breakfast options?', 'I need gluten-free products', 'Recommend alternatives to soft drinks'];
    }

    // Add products if context has recent purchases
    if (context.recentPurchases && context.recentPurchases.length > 0) {
      response += "\n\nBased on your recent purchases, you might also like these alternatives.";
    }

    return {
      success: true,
      message: response,
      suggestions: suggestions,
      nextSuggestions: nextSuggestions,
      products: this.getMockProducts(suggestions.slice(0, 3))
    };
  }

  // Get mock products for suggestions
  getMockProducts(productNames) {
    const mockProducts = {
      'Fresh Vegetables': {
        id: '1',
        name: 'Fresh Seasonal Vegetables',
        price: 40,
        healthScore: 9,
        category: 'groceries',
        image: '/api/placeholder/60/60'
      },
      'Whole Wheat Bread': {
        id: '2',
        name: 'Organic Whole Wheat Bread',
        price: 45,
        healthScore: 8,
        category: 'groceries',
        image: '/api/placeholder/60/60'
      },
      'Greek Yogurt': {
        id: '3',
        name: 'Greek Yogurt - 400g',
        price: 80,
        healthScore: 9,
        category: 'dairy',
        image: '/api/placeholder/60/60'
      },
      'Mixed Nuts': {
        id: '4',
        name: 'Premium Mixed Nuts - 500g',
        price: 450,
        healthScore: 8,
        category: 'snacks',
        image: '/api/placeholder/60/60'
      }
    };

    return productNames
      .map(name => mockProducts[name] || {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        price: Math.floor(Math.random() * 200) + 50,
        healthScore: Math.floor(Math.random() * 4) + 6,
        category: 'groceries',
        image: '/api/placeholder/60/60'
      })
      .filter(Boolean);
  }

  // Extract product suggestions from AI response
  async extractProductSuggestions(aiResponse) {
    // Simple regex to find product mentions
    const productPattern = /(?:recommend|suggest|try)\s+([A-Za-z\s]+?)(?:\.|,|;|$)/gi;
    const matches = [...aiResponse.matchAll(productPattern)];
    
    return matches.map(match => match[1].trim()).filter(Boolean);
  }

  // Generate product insights
  async generateProductInsights(product) {
    try {
      if (!this.isConfigured) {
        // Return mock insights
        return this.getMockProductInsights(product);
      }

      const prompt = `Analyze this product and provide insights:
      Product: ${product.name}
      Category: ${product.category}
      Price: ₹${product.price}
      Ingredients: ${product.ingredients?.join(', ') || 'N/A'}
      
      Provide:
      1. Health score (1-10)
      2. Key health benefits/concerns
      3. Better alternatives if unhealthy
      4. Target audience`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a nutrition and product expert.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150
      });

      return this.parseProductInsights(response.choices[0].message.content);
    } catch (error) {
      console.error('Product Insights Error:', error);
      return this.getMockProductInsights(product);
    }
  }

  getMockProductInsights(product) {
    const healthScore = product.healthScore || Math.floor(Math.random() * 4) + 5;
    
    let insights = '';
    if (healthScore >= 8) {
      insights = `${product.name} is an excellent healthy choice! It's rich in nutrients and low in unhealthy additives. Great for health-conscious consumers.`;
    } else if (healthScore >= 6) {
      insights = `${product.name} is a reasonably healthy option. It provides good nutritional value with moderate levels of sugar and sodium. Suitable for balanced diets.`;
    } else {
      insights = `${product.name} should be consumed in moderation. Consider healthier alternatives with lower sugar or sodium content for regular consumption.`;
    }

    return {
      healthScore,
      insights,
      timestamp: new Date()
    };
  }

  parseProductInsights(text) {
    // Basic parsing - in production, use more sophisticated NLP
    const healthScoreMatch = text.match(/health score[:\s]+(\d+)/i);
    
    return {
      healthScore: healthScoreMatch ? parseInt(healthScoreMatch[1]) : 5,
      insights: text,
      timestamp: new Date()
    };
  }

  // Generate health recommendations
  async generateHealthRecommendations(data) {
    const { healthGoals = [], dietaryRestrictions = [], purchasePatterns = {} } = data;
    
    const recommendations = [];
    
    // Basic recommendations based on goals
    if (healthGoals.includes('lose_weight')) {
      recommendations.push({
        category: 'Weight Management',
        products: ['Low-fat dairy', 'Whole grains', 'Lean proteins', 'Fresh vegetables'],
        tips: 'Focus on high-protein, low-calorie foods to maintain satiety while reducing caloric intake.'
      });
    }
    
    if (healthGoals.includes('low_sugar')) {
      recommendations.push({
        category: 'Low Sugar Options',
        products: ['Sugar-free beverages', 'Fresh fruits', 'Nuts', 'Plain yogurt'],
        tips: 'Check labels for hidden sugars. Choose whole fruits over juices.'
      });
    }
    
    if (dietaryRestrictions.includes('gluten')) {
      recommendations.push({
        category: 'Gluten-Free',
        products: ['Rice products', 'Quinoa', 'Gluten-free bread', 'Fresh produce'],
        tips: 'Always check labels for gluten-containing ingredients.'
      });
    }
    
    return recommendations;
  }
}

// OCR Service implementation
class OCRService {
  constructor() {
    this.isConfigured = false;
    // In development, we'll use mock OCR
    console.log('OCR Service initialized in mock mode');
  }

  async processBillImage(imagePath) {
    try {
      // Mock OCR result for development
      const mockBillData = {
        shopName: 'Smart Mart Superstore',
        date: new Date().toISOString().split('T')[0],
        items: [
          { name: 'Organic Whole Wheat Bread', price: 45, quantity: 2 },
          { name: 'Low Fat Milk - 1L', price: 50, quantity: 3 },
          { name: 'Mixed Nuts - 500g', price: 450, quantity: 1 },
          { name: 'Fresh Vegetables', price: 120, quantity: 1 }
        ],
        total: 760,
        itemCount: 4
      };

      return {
        success: true,
        data: mockBillData,
        confidence: 0.95,
        rawText: 'Mock OCR text output'
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Image Analysis Service
class ImageAnalysisService {
  constructor() {
    this.model = null;
    console.log('Image Analysis Service initialized');
  }

  async analyzeShelfImage(imagePath) {
    try {
      // Mock analysis for development
      const mockAnalysis = {
        isEmpty: false,
        isMessy: Math.random() > 0.7,
        productCount: Math.floor(Math.random() * 20) + 5,
        recommendations: [],
        zones: this.generateMockZones()
      };

      if (mockAnalysis.isEmpty) {
        mockAnalysis.recommendations.push('Shelf is empty - immediate restocking required');
      }
      
      if (mockAnalysis.isMessy) {
        mockAnalysis.recommendations.push('Shelf arrangement needs attention - products are misaligned');
      }

      if (mockAnalysis.productCount < 10) {
        mockAnalysis.recommendations.push('Low product density - consider restocking');
      }

      return {
        success: true,
        analysis: mockAnalysis,
        detections: []
      };
    } catch (error) {
      console.error('Shelf Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateMockZones() {
    const zones = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        zones.push({
          row: i,
          col: j,
          isEmpty: Math.random() > 0.7,
          products: Math.floor(Math.random() * 5)
        });
      }
    }
    return zones;
  }

  async analyzeProductPlacement(imagePath, productData) {
    try {
      const placement = {
        recommendation: 'shelf',
        confidence: 0.8,
        reasons: []
      };

      // Mock analysis based on product data
      if (productData.expiryDate) {
        const daysUntilExpiry = Math.floor(
          (new Date(productData.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 7) {
          placement.recommendation = 'discount_bin';
          placement.reasons.push('Product expiring soon');
        }
      }

      if (productData.stockLevel > 100) {
        placement.recommendation = 'promotion_display';
        placement.reasons.push('Overstock - needs promotion');
      }

      return placement;
    } catch (error) {
      console.error('Product Placement Analysis Error:', error);
      return {
        recommendation: 'shelf',
        confidence: 0.5,
        reasons: ['Default placement']
      };
    }
  }

  async extractFeatures(imageBuffer) {
    // Mock feature extraction
    return {
      colors: ['red', 'blue', 'green'],
      shapes: ['rectangle', 'circle'],
      text: ['Product', 'Label'],
      confidence: 0.85
    };
  }
}

module.exports = {
  AIService: new AIService(),
  OCRService: new OCRService(),
  ImageAnalysisService: new ImageAnalysisService()
};