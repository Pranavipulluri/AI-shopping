const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const vision = require('@google-cloud/vision');

class OCRService {
  constructor() {
    // Initialize Google Vision client if API key is available
    if (process.env.GOOGLE_VISION_API_KEY) {
      this.visionClient = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    }
  }

  // Process bill image and extract items
  async processBillImage(imagePath) {
    try {
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Use Google Vision API if available, fallback to Tesseract
      let ocrResult;
      if (this.visionClient) {
        ocrResult = await this.googleVisionOCR(processedImagePath);
      } else {
        ocrResult = await this.tesseractOCR(processedImagePath);
      }

      // Parse the bill text
      const billData = await this.parseBillText(ocrResult.text);
      
      return {
        success: true,
        data: billData,
        rawText: ocrResult.text,
        confidence: ocrResult.confidence
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Preprocess image for better OCR results
  async preprocessImage(imagePath) {
    const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.png');
    
    await sharp(imagePath)
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(128)
      .toFile(outputPath);
    
    return outputPath;
  }

  // OCR using Tesseract.js
  async tesseractOCR(imagePath) {
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m)
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  }

  // OCR using Google Vision API
  async googleVisionOCR(imagePath) {
    const [result] = await this.visionClient.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    return {
      text: detections[0]?.description || '',
      confidence: 95 // Google Vision doesn't provide confidence scores
    };
  }

  // Parse bill text to extract items and prices
  parseBillText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];
    let total = 0;
    let shopName = '';
    let date = '';

    // Extract shop name (usually in first few lines)
    const shopNamePatterns = [
      /^([A-Z][A-Za-z\s&]+)$/m,
      /(?:store|mart|market|shop):\s*(.+)/i
    ];

    for (const pattern of shopNamePatterns) {
      const match = text.match(pattern);
      if (match) {
        shopName = match[1].trim();
        break;
      }
    }

    // Extract date
    const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      date = dateMatch[1];
    }

    // Extract items and prices
    const itemPattern = /^(.+?)\s+(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)/gm;
    let match;

    while ((match = itemPattern.exec(text)) !== null) {
      const itemName = match[1].trim();
      const price = parseFloat(match[2]);
      
      // Filter out totals, tax, etc.
      if (!itemName.match(/total|tax|discount|change|paid/i)) {
        items.push({
          name: itemName,
          price: price,
          quantity: 1 // Default, could be enhanced to extract quantity
        });
      }
    }

    // Extract total
    const totalPattern = /(?:total|amount).*?(?:Rs\.?|₹)\s*(\d+(?:\.\d{2})?)/i;
    const totalMatch = text.match(totalPattern);
    if (totalMatch) {
      total = parseFloat(totalMatch[1]);
    }

    return {
      shopName,
      date,
      items,
      total,
      itemCount: items.length
    };
  }
}