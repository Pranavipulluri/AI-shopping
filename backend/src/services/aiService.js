const OpenAI = require('openai/index.js');
const { Configuration, OpenAIApi } = require('openai/index.js');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // AI Chatbot for product recommendations and FAQs
  async chatWithBot(message, context = {}) {
    try {
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
      return {
        success: false,
        message: 'I apologize, but I encountered an error. Please try again.',
        error: error.message
      };
    }
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
      return null;
    }
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
}