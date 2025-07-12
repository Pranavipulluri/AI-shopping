import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Check, Plus, Camera, Package, DollarSign, Tag, MapPin } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventory } from '../../services/api';
import { CATEGORIES, PRODUCT_UNITS } from '../../utils/constants';

export default function ProductUpload() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      category: 'groceries',
      price: '',
      originalPrice: '',
      barcode: '',
      unit: 'piece',
      quantity: 1,
      stockLevel: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      expiryDate: '',
      location: {
        aisle: '',
        shelf: '',
        section: ''
      },
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
    }
  });

  const watchCategory = watch('category');

  // Mutation for adding product
  const addProductMutation = useMutation(
    (data) => inventory.addProduct(data),
    {
      onSuccess: () => {
        toast.success('Product added successfully!');
        navigate('/seller/inventory');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add product');
      }
    }
  );

  // Handle image drop
  const onDrop = (acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5
  });

  // Remove image
  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Scan barcode
  const scanBarcode = async () => {
    setIsScanning(true);
    // Implement barcode scanning
    // This would open camera and scan barcode
    setTimeout(() => {
      setValue('barcode', '1234567890123');
      setIsScanning(false);
      toast.success('Barcode scanned successfully');
    }, 2000);
  };

  // Form submission
  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Add basic fields
    Object.keys(data).forEach(key => {
      if (key === 'location' || key === 'nutritionalInfo') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'ingredients') {
        formData.append(key, JSON.stringify(data[key].split(',').map(i => i.trim())));
      } else {
        formData.append(key, data[key]);
      }
    });

    // Add images
    images.forEach((img, index) => {
      formData.append('images', img.file);
    });

    addProductMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Add New Product
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            
            <div className="grid grid-cols-5 gap-4 mb-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt="Product"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('barcode', { 
                    pattern: {
                      value: /^[0-9]{8,14}$/,
                      message: 'Invalid barcode format'
                    }
                  })}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.barcode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter or scan barcode"
                />
                <button
                  type="button"
                  onClick={scanBarcode}
                  disabled={isScanning}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {isScanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>
              {errors.barcode && (
                <p className="mt-1 text-sm text-red-600">{errors.barcode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                {...register('unit', { required: 'Unit is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
              >
                {PRODUCT_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('originalPrice', { 
                  min: { value: 0, message: 'Price must be positive' }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity per Unit
              </label>
              <input
                type="number"
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Quantity must be at least 1' }
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                placeholder="1"
              />
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Inventory Details</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock *
                </label>
                <input
                  type="number"
                  {...register('stockLevel', { 
                    required: 'Stock level is required',
                    min: { value: 0, message: 'Stock cannot be negative' }
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  {...register('minStockLevel', { 
                    min: { value: 0, message: 'Cannot be negative' }
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Stock Level
                </label>
                <input
                  type="number"
                  {...register('maxStockLevel', { 
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  {...register('expiryDate')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Store Location
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aisle
                </label>
                <input
                  type="text"
                  {...register('location.aisle')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="A1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf
                </label>
                <input
                  type="text"
                  {...register('location.shelf')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  {...register('location.section')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  placeholder="Top"
                />
              </div>
            </div>
          </div>

          {/* Nutritional Information (for food items) */}
          {['groceries', 'dairy', 'beverages', 'snacks'].includes(watchCategory) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Nutritional Information (per serving)</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calories
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.calories')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.protein')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.carbs')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.fat')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiber (g)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.fiber')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sugar (g)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.sugar')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sodium (mg)
                  </label>
                  <input
                    type="number"
                    {...register('nutritionalInfo.sodium')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients (comma separated)
                </label>
                <textarea
                  {...register('ingredients')}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 border-gray-300"
                  rows="3"
                  placeholder="Wheat flour, Sugar, Salt..."
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/seller/inventory')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addProductMutation.isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addProductMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
