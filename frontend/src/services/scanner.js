import Quagga from 'quagga';

class ScannerService {
  constructor() {
    this.isInitialized = false;
    this.onDetectedCallbacks = [];
  }

  // Initialize barcode scanner
  async initializeScanner(targetElement, config = {}) {
    const defaultConfig = {
      inputStream: {
        type: 'LiveStream',
        target: targetElement,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment',
          aspectRatio: { min: 1, max: 2 }
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_128_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader'
        ]
      },
      locate: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    return new Promise((resolve, reject) => {
      Quagga.init(finalConfig, (err) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          reject(err);
          return;
        }

        this.isInitialized = true;
        Quagga.start();
        
        // Set up detection handler
        Quagga.onDetected(this.handleDetection.bind(this));
        
        // Set up processed handler for debugging
        Quagga.onProcessed((result) => {
          const drawingCtx = Quagga.canvas.ctx.overlay;
          const drawingCanvas = Quagga.canvas.dom.overlay;

          if (result) {
            if (result.boxes) {
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              result.boxes.filter((box) => box !== result.box).forEach((box) => {
                Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
                  color: 'green',
                  lineWidth: 2
                });
              });
            }

            if (result.box) {
              Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
                color: '#00F',
                lineWidth: 2
              });
            }

            if (result.codeResult && result.codeResult.code) {
              Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, {
                color: 'red',
                lineWidth: 3
              });
            }
          }
        });

        resolve();
      });
    });
  }

  // Handle barcode detection
  handleDetection(result) {
    const code = result.codeResult.code;
    
    // Validate detection confidence
    if (this.validateDetection(result)) {
      // Call all registered callbacks
      this.onDetectedCallbacks.forEach(callback => callback(code, result));
      
      // Play sound effect
      this.playBeep();
    }
  }

  // Validate detection quality
  validateDetection(result) {
    const errors = result.codeResult.decodedCodes
      .filter(x => x.error !== undefined)
      .map(x => x.error);
    
    const avgError = errors.reduce((acc, err) => acc + err, 0) / errors.length;
    
    // Only accept if average error is below threshold
    return avgError < 0.15;
  }

  // Register callback for barcode detection
  onDetected(callback) {
    this.onDetectedCallbacks.push(callback);
  }

  // Stop scanner
  stop() {
    if (this.isInitialized) {
      Quagga.stop();
      this.isInitialized = false;
      this.onDetectedCallbacks = [];
    }
  }

  // Play beep sound
  playBeep() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZURE');
    audio.play().catch(e => console.log('Audio play failed:', e));
  }

  // Scan from image file
  async scanFromImage(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          Quagga.decodeSingle({
            src: canvas.toDataURL(),
            numOfWorkers: 0,
            inputStream: {
              size: canvas.width > 1000 ? 1000 : canvas.width
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'code_39_reader',
                'upc_reader',
                'upc_e_reader'
              ]
            }
          }, (result) => {
            if (result && result.codeResult) {
              resolve(result.codeResult.code);
            } else {
              reject(new Error('No barcode found in image'));
            }
          });
        };
        
        img.src = e.target.result;
      };
      
      reader.readAsDataURL(imageFile);
    });
  }
}

export const scannerService = new ScannerService();

// Helper functions
export const scanBarcode = (barcode) => {
  return api.post('/products/scan', { barcode });
};

export const scanProductImage = (formData) => {
  return api.post('/products/scan-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
