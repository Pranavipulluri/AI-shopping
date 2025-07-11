import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, ShoppingCart, Info, TrendingUp, Heart, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Quagga from 'quagga';

// Services
import { scanBarcode, scanProductImage } from '../../services/scanner';
import { addToCart } from '../../services/api';

// Hooks
import { useCart } from '../../context/CartContext';

export default function ProductScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState('barcode'); // 'barcode' or 'image'
  const [scannedProduct, setScannedProduct] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const webcamRef = useRef(null);
  const { refreshCart } = useCart();

  // Initialize barcode scanner
  const initBarcodeScanner = useCallback(() => {
    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: document.querySelector('#scanner-container'),
        constraints: {
          facingMode: 'environment'
        }
      },
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader']
      }
    }, (err) => {
      if (err) {
        console.error('Quagga initialization failed:', err);
        toast.error('Failed to initialize barcode scanner');
        return;
      }
      
      Quagga.start();
    });

    Quagga.onDetected(handleBarcodeDetected);
  }, []);

  // Handle barcode detection
  const handleBarcodeDetected = async (result) => {
    const code = result.codeResult.code;
    
    setLoading(true);
    Quagga.stop();
    setScanning(false);

    try {
      const response = await scanBarcode(code);
      
      if (response.success) {
        setScannedProduct(response.product);
        setAlternatives(response.alternatives || []);
        toast.success('Product scanned successfully!');
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      toast.error('Failed to scan product');
    } finally {
      setLoading(false);
    }
  };

  // Capture and scan image
  const captureImage = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }

    setLoading(true);
    setScanning(false);

    try {
      // Convert base64 to blob
      const blob = await fetch(imageSrc).then(res => res.blob());
      
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');

      const response = await scanProductImage(formData);
      
      if (response.success) {
        setScannedProduct(response.product);
        setAlternatives(response.alternatives || []);
        toast.success('Product identified!');
      } else {
        toast.error('Could not identify product');
      }
    } catch (error) {
      toast.error('Failed to process image');
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  // Add product to cart
  const handleAddToCart = async (product) => {
    try {
      await addToCart({
        productId: product._id,
        quantity: 1
      });
      
      refreshCart();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Start scanning
  const startScanning = () => {
    setScanning(true);
    setScannedProduct(null);
    setAlternatives([]);

    if (scanMode === 'barcode') {
      setTimeout(initBarcodeScanner, 100);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setScanning(false);
    
    if (scanMode === 'barcode') {
      Quagga.stop();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Smart Product Scanner</h1>

        {/* Scan Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setScanMode('barcode')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              scanMode === 'barcode'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Barcode Scanner
          </button>
          <button
            onClick={() => setScanMode('image')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              scanMode === 'image'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Image Scanner
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {!scanning && !scannedProduct && (
            <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-lg">
              <Camera className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-6">
                {scanMode === 'barcode' 
                  ? 'Position barcode in camera view' 
                  : 'Take a photo of the product'}
              </p>
              <button
                onClick={startScanning}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="relative">
              {scanMode === 'barcode' ? (
                <div id="scanner-container" className="w-full h-96"></div>
              ) : (
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    videoConstraints={{
                      facingMode: 'environment'
                    }}
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <button
                      onClick={captureImage}
                      disabled={loading}
                      className="bg-white text-indigo-600 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                    >
                      Capture
                    </button>
                    <button
                      onClick={stopScanning}
                      className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Scanned Product Display */}
        <AnimatePresence>
          {scannedProduct && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <ProductCard 
                product={scannedProduct} 
                onAddToCart={handleAddToCart}
                isMain={true}
              />

              {alternatives.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Recommended Alternatives</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {alternatives.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAlternative={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setScannedProduct(null);
                    setAlternatives([]);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Scan Another Product
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onAddToCart, isMain, isAlternative }) {
  const getBadgeColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-lg shadow-md p-4 ${isMain ? 'border-2 border-indigo-500' : ''}`}
    >
      <div className="flex gap-4">
        <img
          src={product.image || '/api/placeholder/100/100'}
          alt={product.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{product.name}</h4>
          <p className="text-gray-600 text-sm">{product.category}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-indigo-600">
              ₹{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            {product.healthScore && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(product.healthScore)}`}>
                <Heart className="w-3 h-3 inline mr-1" />
                Health: {product.healthScore}/10
              </span>
            )}
            
            {isAlternative && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.alternativeReason}
              </span>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      {isMain && product.insights && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">{product.insights}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}