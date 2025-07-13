const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function isConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

async function chatWithBot(message, context = {}) {
  if (!isConfigured()) {
    console.warn('OpenAI API Key not found. Returning fallback response.');
    return getFallbackResponse(message);
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
    const response = await openai.chat.completions.create({
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
      message: response.choices?.[0]?.message?.content || 'No AI response.',
      suggestions: await extractProductSuggestions(response.choices?.[0]?.message?.content || '')
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return getFallbackResponse(message);
  }
}

async function generateHealthRecommendations(data) {
  if (!isConfigured()) {
    return {
      success: true,
      recommendations: [
        "Try incorporating more fruits and vegetables",
        "Consider whole grain alternatives",
        "Look for low-sodium options"
      ]
    };
  }

  const prompt = `Generate health recommendations based on:
Health Goals: ${data.healthGoals}
Dietary Restrictions: ${data.dietaryRestrictions}
Purchase Patterns: ${JSON.stringify(data.purchasePatterns)}

Provide 3-5 specific, actionable recommendations.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a nutrition expert providing personalized health recommendations.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return {
      success: true,
      recommendations: response.choices?.[0]?.message?.content?.split('\n').filter(line => line.trim()) || []
    };
  } catch (error) {
    console.error('Health Recommendations Error:', error);
    return {
      success: true,
      recommendations: [
        "Try incorporating more fruits and vegetables",
        "Consider whole grain alternatives",
        "Look for low-sodium options"
      ]
    };
  }
}

function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('healthy') || lower.includes('health')) {
    return {
      success: true,
      message: "Try our fresh fruits, vegetables, and whole grain options!",
      suggestions: ['Apples', 'Carrots', 'Whole grain bread', 'Greek yogurt']
    };
  }

  if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) {
    return {
      success: true,
      message: "Check out store brand items, items on sale, and bulk packs.",
      suggestions: ['Store brand rice', 'Seasonal vegetables', 'Value packs']
    };
  }

  if (lower.includes('gluten') || lower.includes('allergy')) {
    return {
      success: true,
      message: "Look for certified gluten-free items or allergy-safe products in our app.",
      suggestions: ['Gluten-free bread', 'Rice products']
    };
  }

  if (lower.includes('recommend') || lower.includes('suggest')) {
    return {
      success: true,
      message: "Try our popular fresh produce, dairy, and whole grain options.",
      suggestions: ['Vegetables', 'Dairy products', 'Whole grains']
    };
  }

  return {
    success: true,
    message: "I'm here to help you with healthy options, savings, or any shopping advice. Ask me anything!",
    suggestions: ['Healthy snacks', 'Today\'s deals', 'Popular items']
  };
}

async function extractProductSuggestions(text) {
  if (!text) return [];
  const suggestions = [];
  const patterns = [/recommend\s+([^.,;]+)/gi, /try\s+([^.,;]+)/gi];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text))) {
      if (match[1]) suggestions.push(match[1].trim());
    }
  });

  return [...new Set(suggestions)].slice(0, 4);
}

async function generateProductInsights(product) {
  if (!isConfigured()) {
    return generateBasicInsights(product);
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

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a nutrition and product expert.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150
    });

    return parseProductInsights(response.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('Product Insights Error:', error);
    return generateBasicInsights(product);
  }
}

function generateBasicInsights(product) {
  let healthScore = product.healthScore || 5;
  let insights = '';

  if (product.nutritionalInfo) {
    if (product.nutritionalInfo.sugar > 15) healthScore -= 2;
    if (product.nutritionalInfo.sodium > 500) healthScore -= 1;
    if (product.nutritionalInfo.protein > 10) healthScore += 1;
    if (product.nutritionalInfo.fiber > 5) healthScore += 1;
    healthScore = Math.max(1, Math.min(10, healthScore));
  }

  if (healthScore >= 8) {
    insights = 'This is a healthy choice with good nutritional value.';
  } else if (healthScore >= 6) {
    insights = 'This product is moderately healthy. Consider better alternatives.';
  } else {
    insights = 'Consume this product in moderation.';
  }

  return {
    healthScore,
    insights,
    timestamp: new Date()
  };
}

function parseProductInsights(text) {
  const healthScoreMatch = text.match(/health score[:\s]+(\d+)/i);
  return {
    healthScore: healthScoreMatch ? parseInt(healthScoreMatch[1]) : 5,
    insights: text,
    timestamp: new Date()
  };
}

// OCR Service placeholder
const OCRService = {
  async processBillImage(imagePath) {
    // Placeholder implementation
    return {
      success: true,
      data: {
        items: [],
        total: 0
      },
      confidence: 0.8
    };
  }
};

// Image Analysis Service placeholder
const ImageAnalysisService = {
  async analyzeProductPlacement(imagePath, productData) {
    // Placeholder implementation
    return {
      placement: 'optimal',
      suggestions: []
    };
  }
};

// Export services as separate objects
const AIService = {
  chatWithBot,
  generateProductInsights,
  generateHealthRecommendations
};

module.exports = {
  AIService,
  OCRService,
  ImageAnalysisService
};