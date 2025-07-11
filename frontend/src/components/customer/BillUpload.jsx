import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Camera, Check, X, ShoppingBag, Calendar, DollarSign, Store } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

// Services
import { uploadBill, processBillOCR } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BillUpload() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [billData, setBillData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);

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

    // Process bill
    await processBill(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.pdf']
    },
    maxFiles: 1
  });

  // Process bill with OCR
  const processBill = async (file) => {
    setProcessing(true);
    setBillData(null);

    const formData = new FormData();
    formData.append('bill', file);

    try {
      const response = await processBillOCR(formData);
      
      if (response.success) {
        setBillData(response.data);
        toast.success('Bill processed successfully!');
      } else {
        toast.error('Failed to process bill');
      }
    } catch (error) {
      toast.error('Error processing bill. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Save bill data
  const saveBillData = async () => {
    try {
      const response = await uploadBill({
        ...billData,
        userId: user.id,
        uploadedAt: new Date()
      });

      if (response.success) {
        toast.success('Bill saved to your purchase history!');
        // Reset state
        setBillData(null);
        setImagePreview(null);
        setEditMode(false);
      }
    } catch (error) {
      toast.error('Failed to save bill');
    }
  };

  // Update item in bill
  const updateBillItem = (index, field, value) => {
    const updatedItems = [...billData.items];
    updatedItems[index][field] = value;
    
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => 
      sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1), 0
    );
    
    setBillData({
      ...billData,
      items: updatedItems,
      total: newTotal
    });
  };

  // Remove item from bill
  const removeItem = (index) => {
    const updatedItems = billData.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, item) => 
      sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1), 0
    );
    
    setBillData({
      ...billData,
      items: updatedItems,
      total: newTotal
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Upload Shopping Bill
        </h1>

        {!billData && !processing && (
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2">
                {isDragActive ? 'Drop your bill here' : 'Drag & drop your shopping bill'}
              </p>
              <p className="text-sm text-gray-500">
                or click to select file (JPG, PNG, PDF)
              </p>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Upload a photo of your shopping bill</li>
                <li>2. Our AI will automatically extract items and prices</li>
                <li>3. Review and edit if needed</li>
                <li>4. Save to track your spending over time</li>
              </ol>
            </div>
          </div>
        )}

        {processing && (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Processing your bill...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        )}

        {billData && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Bill Preview */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Original Bill</h3>
                  <img
                    src={imagePreview}
                    alt="Bill preview"
                    className="w-full rounded-lg shadow-md"
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Extracted Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={billData.shopName || ''}
                        onChange={(e) => setBillData({ ...billData, shopName: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Store name"
                        disabled={!editMode}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <input
                        type="date"
                        value={billData.date || ''}
                        onChange={(e) => setBillData({ ...billData, date: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={!editMode}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="ml-2 font-bold text-lg">₹{billData.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Items ({billData.items?.length || 0})</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    {editMode ? 'Done Editing' : 'Edit Items'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        {editMode && (
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {billData.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateBillItem(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={!editMode}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={!editMode}
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateBillItem(index, 'price', parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              disabled={!editMode}
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-2 font-medium">
                            ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </td>
                          {editMode && (
                            <td className="px-4 py-2">
                              <button
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setBillData(null);
                    setImagePreview(null);
                    setEditMode(false);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBillData}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Bill
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}