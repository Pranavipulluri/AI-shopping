// DEBUGGING GUIDE FOR AI CHAT 500 ERROR

// 1. First, check if your backend server is running:
// Terminal: cd backend && npm run dev

// 2. Check if the required environment variables are set in backend/.env:
/*
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/smart-shopping
*/

// 3. Updated backend/src/services/aiService.js with better error handling:

const OpenAI = require('openai');

class AIService {
  constructor() {
    // Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.isConfigured = true;
    } else {
      console.warn('OpenAI API key not configured. Using fallback responses.');
      this.isConfigured = false;
    }
  }

  // AI Chatbot for product recommendations and FAQs
  async chatWithBot(message, context = {}) {
    try {
      // If OpenAI is not configured, use fallback responses
      if (!this.isConfigured) {
        return this.getFallbackResponse(message, context);
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

      try {
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
      } catch (openAIError) {
        console.error('OpenAI API Error:', openAIError);
        // Fall back to simple responses if OpenAI fails
        return this.getFallbackResponse(message, context);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  // Fallback responses when OpenAI is not available
  getFallbackResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Simple keyword-based responses
    if (lowerMessage.includes('healthy') || lowerMessage.includes('health')) {
      return {
        success: true,
        message: "I recommend checking out our organic products, fresh fruits, vegetables, and whole grain items. These are great healthy options! You can also look for products with high health scores (8+ out of 10) in our app.",
        suggestions: ['Organic vegetables', 'Fresh fruits', 'Whole grain bread', 'Greek yogurt']
      };
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      return {
        success: true,
        message: "Looking for budget-friendly options? Check out our store brand products, items on sale, and bulk purchase options. Don't forget to check the 'Savings' section in your cart!",
        suggestions: ['Store brand items', 'Bulk rice', 'Seasonal vegetables', 'Value packs']
      };
    }
    
    if (lowerMessage.includes('gluten') || lowerMessage.includes('allergy')) {
      return {
        success: true,
        message: "For dietary restrictions, I recommend using our product scanner to check ingredients. Look for certified gluten-free products in our health section. Always check product labels for allergen information.",
        suggestions: ['Gluten-free bread', 'Rice products', 'Certified allergen-free items']
      };
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return {
        success: true,
        message: "Based on popular choices, I recommend checking out our fresh produce section, dairy products, and whole grain items. Use our product scanner to compare health scores and find the best options for you!",
        suggestions: ['Fresh vegetables', 'Low-fat dairy', 'Whole grains', 'Lean proteins']
      };
    }
    
    // Default response
    return {
      success: true,
      message: "I'm here to help you with your shopping! You can ask me about healthy alternatives, budget-friendly options, dietary restrictions, or any product-related questions. How can I assist you today?",
      suggestions: ['Healthy snacks', 'Today\'s deals', 'New arrivals', 'Popular items']
    };
  }

  // Extract product suggestions from AI response
  async extractProductSuggestions(aiResponse) {
    if (!aiResponse) return [];
    
    // Simple extraction based on common patterns
    const suggestions = [];
    const patterns = [
      /recommend\s+([^.,;]+)/gi,
      /try\s+([^.,;]+)/gi,
      /consider\s+([^.,;]+)/gi,
      /check out\s+([^.,;]+)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(aiResponse)) !== null) {
        if (match[1] && match[1].length < 50) {
          suggestions.push(match[1].trim());
        }
      }
    });
    
    return [...new Set(suggestions)].slice(0, 4); // Return unique suggestions, max 4
  }

  // Generate product insights
  async generateProductInsights(product) {
    try {
      if (!this.isConfigured) {
        // Provide basic insights without AI
        return this.generateBasicInsights(product);
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
      return this.generateBasicInsights(product);
    }
  }

  generateBasicInsights(product) {
    let healthScore = product.healthScore || 5;
    let insights = '';
    
    if (product.nutritionalInfo) {
      // Basic health scoring based on nutritional info
      if (product.nutritionalInfo.sugar > 15) healthScore -= 2;
      if (product.nutritionalInfo.sodium > 500) healthScore -= 1;
      if (product.nutritionalInfo.protein > 10) healthScore += 1;
      if (product.nutritionalInfo.fiber > 5) healthScore += 1;
      
      healthScore = Math.max(1, Math.min(10, healthScore));
    }
    
    if (healthScore >= 8) {
      insights = 'This is a healthy choice with good nutritional value.';
    } else if (healthScore >= 6) {
      insights = 'This product has moderate nutritional value. Consider healthier alternatives for regular consumption.';
    } else {
      insights = 'This product should be consumed in moderation. Look for healthier alternatives.';
    }
    
    return {
      healthScore,
      insights,
      timestamp: new Date()
    };
  }

  parseProductInsights(text) {
    const healthScoreMatch = text.match(/health score[:\s]+(\d+)/i);
    
    return {
      healthScore: healthScoreMatch ? parseInt(healthScoreMatch[1]) : 5,
      insights: text,
      timestamp: new Date()
    };
  }
}