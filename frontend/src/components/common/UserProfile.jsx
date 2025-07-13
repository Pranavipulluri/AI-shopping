
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { validateForm } from '../../utils/validators';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'India'
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProfile(formData);
    setLoading(false);

    if (result.success) {
      setEditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            My Profile
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="flex items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-lg">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-gray-600">{user?.role === 'seller' ? 'Seller Account' : 'Customer Account'}</p>
            <p className="text-sm text-gray-500 mt-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Member since {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Street Address"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                disabled={!editing}
                placeholder="City"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                disabled={!editing}
                placeholder="State"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                disabled={!editing}
                placeholder="ZIP Code"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Country"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
          </div>

          {editing && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    address: user?.address || {}
                  });
                }}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

// ===================================
// frontend/src/components/common/Settings.jsx
// ===================================
