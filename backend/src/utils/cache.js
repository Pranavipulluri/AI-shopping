const { redisClient } = require('../config/database');

class CacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutes
    this.client = redisClient;
  }

  // Generate cache key
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    return `${prefix}:${sortedParams}`;
  }

  // Get from cache
  async get(key) {
    try {
      if (!this.client) return null;
      
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set in cache
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.client) return;
      
      await this.client.setEx(
        key,
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete from cache
  async delete(key) {
    try {
      if (!this.client) return;
      
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (!this.client) return;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  }

  // Cache middleware
  middleware(prefix, ttl = this.defaultTTL) {
    return async (req, res, next) => {
      // Skip cache for non-GET requests
      if (req.method !== 'GET') return next();
      
      // Skip cache if user wants fresh data
      if (req.headers['cache-control'] === 'no-cache') return next();
      
      const key = this.generateKey(prefix, {
        ...req.params,
        ...req.query,
        user: req.user?.id || 'anonymous'
      });
      
      const cached = await this.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        res.json = originalJson;
        
        // Cache successful responses only
        if (data.success !== false) {
          CacheService.prototype.set.call(this, key, data, ttl);
        }
        
        return res.json(data);
      }.bind(this);
      
      next();
    };
  }
}

module.exports = new CacheService();