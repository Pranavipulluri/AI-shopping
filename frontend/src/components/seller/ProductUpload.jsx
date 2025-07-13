// frontend/src/components/seller/ProductUpload.jsx
import React, { useState } from 'react';
import { Upload, Plus, X, Save, Package, Camera, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventory } from '../../services/api';
import { CATEGORIES, PRODUCT_UNITS } from '../../utils/constants';

export default function ProductUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    barcode: '',
    price: '',
    originalPrice: '',
    unit: 'piece',
    quantity: '1',
    description: '',
    stockLevel: '',
    minStockLevel: '10',
    maxStockLevel: '100',
    location: {
      aisle: '',
      shelf: '',
      section: ''
    },
    expiryDate: '',
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: ''
    },
    ingredients: '',
    allergens: []
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle allergen selection
  const handleAllergenToggle = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  // Handle image drop
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setProductImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && !Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add image if present
      if (productImage) {
        formDataToSend.append('productImage', productImage);
      }

      const response = await inventory.addProduct(formDataToSend);
      
      if (response.success) {
        toast.success('Product added successfully!');
        navigate('/seller/inventory');
      }
    } catch (error) {
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  // Scan barcode
  const handleBarcodeScan = () => {
    // This would trigger barcode scanner
    toast.info('Barcode scanner not implemented in demo');
  };

  const allergenOptions = [
    'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts',
    'Peanuts', 'Wheat', 'Soybeans', 'Sesame'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Add New Product
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter or scan barcode"
                />
                <button
                  type="button"
                  onClick={handleBarcodeScan}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {PRODUCT_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Inventory Management</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock *
                </label>
                <input
                  type="number"
                  name="stockLevel"
                  value={formData.stockLevel}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  name="maxStockLevel"
                  value={formData.maxStockLevel}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Location</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="text"
                name="location.aisle"
                value={formData.location.aisle}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Aisle"
              />
              <input
                type="text"
                name="location.shelf"
                value={formData.location.shelf}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Shelf"
              />
              <input
                type="text"
                name="location.section"
                value={formData.location.section}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Section"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter product description"
            />
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergens
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {allergenOptions.map(allergen => (
                <label key={allergen} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(allergen)}
                    onChange={() => handleAllergenToggle(allergen)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm">{allergen}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate('/seller/inventory')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}