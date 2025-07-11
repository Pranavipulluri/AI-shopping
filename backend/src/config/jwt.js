const jwt = require('jsonwebtoken');

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  
  sign: (payload) => {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
  },
  
  verify: (token) => {
    return jwt.verify(token, jwtConfig.secret);
  },
  
  decode: (token) => {
    return jwt.decode(token);
  }
};

module.exports = jwtConfig;