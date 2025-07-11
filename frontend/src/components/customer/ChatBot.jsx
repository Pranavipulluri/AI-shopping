import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, ShoppingBag, Heart, DollarSign, Loader } from 'lucide-react';
import { format } from 'date-fns';

// Services
import { sendChatMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ChatBot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hello ${user?.name}! I'm your shopping assistant. I can help you with:
      • Product recommendations
      • Finding healthier alternatives
      • Budget-friendly options
      • Dietary restrictions
      • Product information
      
      What can I help you with today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Show me healthy snacks',
    'What are budget-friendly breakfast options?',
    'I need gluten-free products',
    'Recommend alternatives to soft drinks'
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get user context
      const context = {
        userName: user?.name,
        dietaryRestrictions: user?.preferences?.dietaryRestrictions || [],
        healthGoals: user?.preferences?.healthGoals || [],
        recentPurchases: [] // Could be fetched from order history
      };

      // Send to AI service
      const response = await sendChatMessage({
        message,
        context,
        conversationHistory: messages.slice(-5) // Last 5 messages for context
      });

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.message,
        suggestions: response.suggestions,
        products: response.products,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);

      // Update suggestions if provided
      if (response.nextSuggestions) {
        setSuggestions(response.nextSuggestions);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-full">
      <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Shopping Assistant</h2>
              <p className="text-sm text-indigo-100">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-gray-500"
            >
              <Bot className="w-5 h-5" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Component
function Message({ message }) {
  const isBot = message.type === 'bot';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isBot ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
      }`}>
        {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 ${isBot ? '' : 'flex justify-end'}`}>
        <div className={`inline-block max-w-[80%] ${
          isBot ? 'bg-gray-100' : 'bg-indigo-600 text-white'
        } rounded-lg px-4 py-2`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Product Recommendations */}
          {message.products && message.products.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.products.map((product) => (
                <ProductRecommendation key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
        
        <p className={`text-xs text-gray-500 mt-1 ${isBot ? '' : 'text-right'}`}>
          {format(message.timestamp, 'HH:mm')}
        </p>
      </div>
    </motion.div>
  );
}

// Product Recommendation Component
function ProductRecommendation({ product }) {
  return (
    <div className="bg-white rounded-lg p-3 border">
      <div className="flex gap-3">
        <img
          src={product.image || '/api/placeholder/60/60'}
          alt={product.name}
          className="w-16 h-16 object-cover rounded"
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-sm">{product.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-indigo-600 font-bold">₹{product.price}</span>
            {product.healthScore && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {product.healthScore}/10
              </span>
            )}
          </div>
          
          <button className="mt-2 text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}