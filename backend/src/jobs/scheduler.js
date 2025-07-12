const cron = require('node-cron');
const logger = require('../utils/logger');
const Inventory = require('../models/Inventory');
const Analytics = require('../models/Analytics');
const { AIService } = require('../services/aiService');

class JobScheduler {
  constructor() {
    this.jobs = [];
  }

  start() {
    logger.info('Starting job scheduler...');
    
    // Check inventory alerts every hour
    this.scheduleJob('0 * * * *', 'Inventory Alert Check', async () => {
      await this.checkInventoryAlerts();
    });
    
    // Generate demand predictions daily at 2 AM
    this.scheduleJob('0 2 * * *', 'Demand Prediction', async () => {
      await this.generateDemandPredictions();
    });
    
    // Clean up old analytics data weekly
    this.scheduleJob('0 0 * * 0', 'Analytics Cleanup', async () => {
      await this.cleanupAnalytics();
    });
    
    // Update product health scores daily
    this.scheduleJob('0 3 * * *', 'Health Score Update', async () => {
      await this.updateHealthScores();
    });
    
    logger.info(`Scheduled ${this.jobs.length} jobs`);
  }

  scheduleJob(cronExpression, name, task) {
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Running job: ${name}`);
      const startTime = Date.now();
      
      try {
        await task();
        const duration = Date.now() - startTime;
        logger.info(`Job ${name} completed in ${duration}ms`);
      } catch (error) {
        logger.error(`Job ${name} failed:`, error);
      }
    });
    
    this.jobs.push({ name, job });
  }

  async checkInventoryAlerts() {
    try {
      const inventories = await Inventory.find({ isActive: true })
        .populate('product', 'name')
        .populate('seller');
      
      let alertsGenerated = 0;
      
      for (const inventory of inventories) {
        const alerts = await inventory.checkAlerts();
        if (alerts.alerts.length > 0) {
          alertsGenerated += alerts.alerts.length;
          
          // Send notification to seller
          const io = global.io;
          if (io) {
            io.to(`user_${inventory.seller._id}`).emit('notification', {
              type: 'inventory_alert',
              message: `${alerts.alerts.length} new alerts for your inventory`,
              timestamp: new Date()
            });
          }
        }
      }
      
      logger.info(`Generated ${alertsGenerated} inventory alerts`);
    } catch (error) {
      logger.error('Error checking inventory alerts:', error);
    }
  }

  async generateDemandPredictions() {
    try {
      const Product = require('../models/Product');
      
      // Get all active products
      const products = await Product.find({ isActive: true });
      
      for (const product of products) {
        // Get historical sales data
        const salesData = await Analytics.find({
          product: product._id,
          type: 'sale',
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        
        if (salesData.length > 0) {
          // Simple moving average prediction
          const dailySales = salesData.reduce((acc, sale) => {
            const date = sale.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + sale.unitsSold;
            return acc;
          }, {});
          
          const avgDailySales = Object.values(dailySales).reduce((a, b) => a + b, 0) / Object.keys(dailySales).length;
          
          product.predictedDemand = {
            daily: Math.ceil(avgDailySales),
            weekly: Math.ceil(avgDailySales * 7),
            monthly: Math.ceil(avgDailySales * 30),
            lastUpdated: new Date()
          };
          
          await product.save();
        }
      }
      
      logger.info('Demand predictions updated successfully');
    } catch (error) {
      logger.error('Error generating demand predictions:', error);
    }
  }

  async cleanupAnalytics() {
    try {
      // Delete analytics older than 90 days
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const result = await Analytics.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old analytics records`);
    } catch (error) {
      logger.error('Error cleaning up analytics:', error);
    }
  }

  async updateHealthScores() {
    try {
      const Product = require('../models/Product');
      
      const products = await Product.find({
        isActive: true,
        category: { $in: ['groceries', 'dairy', 'beverages', 'snacks'] }
      });
      
      let updated = 0;
      
      for (const product of products) {
        if (product.nutritionalInfo) {
          const oldScore = product.healthScore;
          const newScore = product.calculateHealthScore();
          
          if (oldScore !== newScore) {
            product.healthScore = newScore;
            await product.save();
            updated++;
          }
        }
      }
      
      logger.info(`Updated health scores for ${updated} products`);
    } catch (error) {
      logger.error('Error updating health scores:', error);
    }
  }

  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
  }
}

module.exports = new JobScheduler();