const tf = require('@tensorflow/tfjs-node');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const sharp = require('sharp');

class ImageAnalysisService {
  constructor() {
    this.model = null;
    this.initializeModel();
  }

  async initializeModel() {
    try {
      this.model = await cocoSsd.load();
      console.log('COCO-SSD model loaded successfully');
    } catch (error) {
      console.error('Error loading COCO-SSD model:', error);
    }
  }

  // Analyze shelf image for inventory management
  async analyzeShelfImage(imagePath) {
    try {
      if (!this.model) {
        await this.initializeModel();
      }

      // Load and preprocess image
      const imageBuffer = await sharp(imagePath)
        .resize(640, 480)
        .toBuffer();

      // Convert to tensor
      const imageTensor = tf.node.decodeImage(imageBuffer);

      // Detect objects
      const predictions = await this.model.detect(imageTensor);

      // Analyze shelf status
      const shelfAnalysis = this.analyzeShelfStatus(predictions);

      // Clean up
      imageTensor.dispose();

      return {
        success: true,
        analysis: shelfAnalysis,
        detections: predictions
      };
    } catch (error) {
      console.error('Shelf Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  analyzeShelfStatus(predictions) {
    const analysis = {
      isEmpty: true,
      isMessy: false,
      productCount: 0,
      recommendations: [],
      zones: []
    };

    // Count detected objects
    const objectCounts = {};
    predictions.forEach(pred => {
      objectCounts[pred.class] = (objectCounts[pred.class] || 0) + 1;
      analysis.productCount++;
    });

    analysis.isEmpty = analysis.productCount === 0;

    // Check if shelf is messy (objects overlapping or misaligned)
    const overlappingObjects = this.checkOverlapping(predictions);
    analysis.isMessy = overlappingObjects > predictions.length * 0.2;

    // Generate recommendations
    if (analysis.isEmpty) {
      analysis.recommendations.push('Shelf is empty - immediate restocking required');
    }
    
    if (analysis.isMessy) {
      analysis.recommendations.push('Shelf arrangement needs attention - products are misaligned');
    }

    // Identify empty zones
    analysis.zones = this.identifyEmptyZones(predictions);

    return analysis;
  }

  checkOverlapping(predictions) {
    let overlapping = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        if (this.boxesOverlap(predictions[i].bbox, predictions[j].bbox)) {
          overlapping++;
        }
      }
    }
    
    return overlapping;
  }

  boxesOverlap(box1, box2) {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;
    
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }

  identifyEmptyZones(predictions) {
    // Simple grid-based empty zone detection
    const gridSize = 3;
    const zones = [];
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const zone = {
          row: i,
          col: j,
          isEmpty: true,
          products: 0
        };
        
        // Check if any predictions fall in this zone
        predictions.forEach(pred => {
          const [x, y] = pred.bbox;
          const zoneX = Math.floor(x / (640 / gridSize));
          const zoneY = Math.floor(y / (480 / gridSize));
          
          if (zoneX === j && zoneY === i) {
            zone.isEmpty = false;
            zone.products++;
          }
        });
        
        zones.push(zone);
      }
    }
    
    return zones;
  }

  // Analyze product placement recommendations
  async analyzeProductPlacement(productImage, productData) {
    try {
      const placement = {
        recommendation: 'shelf',
        confidence: 0.8,
        reasons: []
      };

      // Check expiry date
      if (productData.expiryDate) {
        const daysUntilExpiry = Math.floor(
          (new Date(productData.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry < 7) {
          placement.recommendation = 'discount_bin';
          placement.reasons.push('Product expiring soon');
        } else if (daysUntilExpiry < 30) {
          placement.recommendation = 'front_shelf';
          placement.reasons.push('Promote before expiry');
        }
      }

      // Check sales velocity
      if (productData.salesVelocity < 0.1) {
        placement.recommendation = 'online_resale';
        placement.reasons.push('Low in-store demand');
      }

      // Check stock levels
      if (productData.stockLevel > productData.maxStock * 0.8) {
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
}

module.exports = {
  AIService: new AIService(),
  OCRService: new OCRService(),
  ImageAnalysisService: new ImageAnalysisService()
};