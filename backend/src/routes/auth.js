const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Existing routes
router.post('/register', 
  [
    body('name').trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  authController.register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Logout
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;

// ===================================
// backend/src/models/User.js (Updated with Google fields)
// ===================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required for Google users
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // ... rest of the schema remains the same
});

// Only hash password if it exists and is modified
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update comparePassword method
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) {
    return false; // Google users don't have passwords
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// ===================================
// frontend/src/components/auth/LoginForm.jsx (Updated with Google Sign-In)
// ===================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { validateForm } from '../../utils/validators';
import LoadingSpinner from '../common/LoadingSpinner';
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  // ... existing form handling code ...

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwt_decode(credentialResponse.credential);
      
      // Send to backend
      const result = await googleLogin({
        token: credentialResponse.credential,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      });

      if (result.success) {
        navigate(`/${result.user.role}`);
      }
    } catch (error) {
      setErrors({ general: 'Google sign-in failed' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ... existing logo and header ... */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... existing form fields ... */}
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrors({ general: 'Google sign-in failed' })}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}