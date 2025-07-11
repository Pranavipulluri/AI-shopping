export const validationRules = {
  required: (value) => !!value || 'This field is required',
  
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || 'Invalid email address';
  },
  
  phone: (value) => {
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(value) || 'Invalid phone number';
  },
  
  password: (value) => {
    if (value.length < 6) return 'Password must be at least 6 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain number';
    return true;
  },
  
  confirmPassword: (value, password) => {
    return value === password || 'Passwords do not match';
  },
  
  barcode: (value) => {
    const pattern = /^[0-9]{8,14}$/;
    return pattern.test(value) || 'Invalid barcode format';
  },
  
  price: (value) => {
    return (value > 0 && !isNaN(value)) || 'Price must be a positive number';
  },
  
  quantity: (value) => {
    return (Number.isInteger(value) && value > 0) || 'Quantity must be a positive integer';
  },
  
  minLength: (min) => (value) => {
    return value.length >= min || `Minimum ${min} characters required`;
  },
  
  maxLength: (max) => (value) => {
    return value.length <= max || `Maximum ${max} characters allowed`;
  },
  
  minValue: (min) => (value) => {
    return value >= min || `Minimum value is ${min}`;
  },
  
  maxValue: (max) => (value) => {
    return value <= max || `Maximum value is ${max}`;
  }
};

// Validate form data
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    const value = data[field];
    
    for (const rule of fieldRules) {
      let result;
      
      if (typeof rule === 'function') {
        result = rule(value, data);
      } else if (typeof rule === 'string' && validationRules[rule]) {
        result = validationRules[rule](value, data);
      }
      
      if (result !== true) {
        errors[field] = result;
        break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>]/g, '');
};

// Validate file upload
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;

  if (!file) return { isValid: false, error: 'No file selected' };
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: 'Invalid file extension' };
  }
  
  return { isValid: true };
};