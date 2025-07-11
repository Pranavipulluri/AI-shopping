import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Eye, AlertTriangle, CheckCircle, RefreshCw, Grid, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

// Services
import { analyzeShelfImage } from '../../services/api';

export default function ShelfMonitor() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const webcamRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);

  // Handle file drop
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Set selected image
    setSelectedImage(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  // Analyze shelf image
  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await analyzeShelfImage(formData);
      
      if (response.success) {
        setAnalysis(response.analysis);
        toast.success('Shelf analysis completed');
      } else {
        toast.error('Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze shelf');
    } finally {
      setAnalyzing(false);
    }
  };

  // Capture from webcam
  const captureFromWebcam = () => {
    if (!webcamRef.current) return;

    const video = webcamRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'shelf-capture.jpg', { type: 'image/jpeg' });
      setSelectedImage(file);
      setImagePreview(canvas.toDataURL());
      setShowWebcam(false);
    });
  };

  // Get zone status color
  const getZoneColor = (zone) => {
    if (zone.isEmpty) return 'bg-red-100 border-red-300';
    if (zone.products < 3) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Eye className="w-6 h-6" />
          Shelf Health Monitor
        </h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Upload Shelf Image</h2>
            
            {!imagePreview ? (
              <>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop shelf image here'}
                  </p>
                  <p className="text-sm text-gray-500">or click to select file</p>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowWebcam(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 mx-auto"
                  >
                    <Camera className="w-5 h-5" />
                    Use Camera Instead
                  </button>
                </div>
              </>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Shelf preview"
                  className="w-full rounded-lg shadow-md"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Analyze Shelf
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Webcam Modal */}
            {showWebcam && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
                  <h3 className="text-lg font-semibold mb-4">Capture Shelf Image</h3>
                  
                  <video
                    ref={webcamRef}
                    autoPlay
                    className="w-full rounded-lg mb-4"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={captureFromWebcam}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => setShowWebcam(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>
            
            {analysis ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Overall Status */}
                <div className={`p-4 rounded-lg ${
                  analysis.isEmpty ? 'bg-red-50' :
                  analysis.isMessy ? 'bg-yellow-50' :
                  'bg-green-50'
                }`}>
                  <div className="flex items-center gap-3">
                    {analysis.isEmpty ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : analysis.isMessy ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {analysis.isEmpty ? 'Shelf Empty' :
                         analysis.isMessy ? 'Shelf Needs Attention' :
                         'Shelf Well Organized'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analysis.productCount} products detected
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zone Grid */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Shelf Zones
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {analysis.zones.map((zone, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 text-center ${getZoneColor(zone)}`}
                      >
                        <Package className={`w-6 h-6 mx-auto mb-1 ${
                          zone.isEmpty ? 'text-red-500' :
                          zone.products < 3 ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <p className="text-xs font-medium">
                          Zone {zone.row + 1}-{zone.col + 1}
                        </p>
                        <p className="text-xs text-gray-600">
                          {zone.isEmpty ? 'Empty' : `${zone.products} items`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Create Restocking Task
                  </button>
                  <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                    Schedule Maintenance
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Upload and analyze a shelf image to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}