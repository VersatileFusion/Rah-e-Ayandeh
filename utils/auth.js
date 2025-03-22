const jwt = require('jsonwebtoken');
const redis = require('redis');
const { promisify } = require('util');
const { UnauthorizedError } = require('./errorHandler');
const { logger } = require('./logger');
const User = require('../models/User');

// Initialize Redis client for refresh tokens
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  legacyMode: false,
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis for token management');
});

// Create promisified Redis commands
const redisGet = promisify(redisClient.get).bind(redisClient);
const redisSet = promisify(redisClient.set).bind(redisClient);
const redisDel = promisify(redisClient.del).bind(redisClient);

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis:', { error: err.message });
  }
})();

// JWT token generation and verification
const auth = {
  /**
   * Generate access token for a user
   * @param {Object} user - User object
   * @returns {String} - JWT access token
   */
  generateAccessToken: (user) => {
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'jwt_fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  },
  
  /**
   * Generate refresh token for a user
   * @param {Object} user - User object
   * @returns {String} - JWT refresh token
   */
  generateRefreshToken: async (user) => {
    const payload = {
      id: user._id,
      type: 'refresh'
    };
    
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || 'jwt_refresh_fallback_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    // Store refresh token in Redis with user ID as key
    const tokenKey = `refresh_token:${user._id}`;
    await redisSet(tokenKey, refreshToken, 'EX', 60 * 60 * 24 * 7); // 7 days
    
    logger.debug('Refresh token stored in Redis', { userId: user._id });
    
    return refreshToken;
  },
  
  /**
   * Verify access token
   * @param {String} token - JWT access token
   * @returns {Object} - Decoded token payload
   */
  verifyAccessToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'jwt_fallback_secret');
    } catch (error) {
      logger.warn('Access token verification failed', { error: error.message });
      throw new UnauthorizedError(
        'توکن نامعتبر است. لطفا مجددا وارد شوید',
        'Invalid token. Please login again'
      );
    }
  },
  
  /**
   * Verify refresh token and check if it exists in Redis
   * @param {String} token - JWT refresh token
   * @returns {Object} - Decoded token payload
   */
  verifyRefreshToken: async (token) => {
    try {
      // Verify token signature and expiration
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'jwt_refresh_fallback_secret'
      );
      
      // Check if token exists in Redis
      const tokenKey = `refresh_token:${decoded.id}`;
      const storedToken = await redisGet(tokenKey);
      
      if (!storedToken || storedToken !== token) {
        logger.warn('Refresh token not found in Redis or does not match', { userId: decoded.id });
        throw new UnauthorizedError(
          'توکن نامعتبر است. لطفا مجددا وارد شوید',
          'Invalid token. Please login again'
        );
      }
      
      return decoded;
    } catch (error) {
      logger.warn('Refresh token verification failed', { error: error.message });
      throw new UnauthorizedError(
        'توکن منقضی شده است. لطفا مجددا وارد شوید',
        'Token expired. Please login again'
      );
    }
  },
  
  /**
   * Invalidate refresh token
   * @param {String} userId - User ID
   */
  invalidateRefreshToken: async (userId) => {
    const tokenKey = `refresh_token:${userId}`;
    await redisDel(tokenKey);
    logger.debug('Refresh token invalidated', { userId });
  },
  
  /**
   * Middleware to authenticate requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticateToken: (req, res, next) => {
    // Get authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError(
        'توکن دسترسی الزامی است',
        'Access token is required'
      );
    }
    
    try {
      // Verify token
      const decoded = auth.verifyAccessToken(token);
      
      // Set user in request object
      req.user = decoded;
      
      next();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Middleware to check user role
   * @param {String[]} roles - Allowed roles
   * @returns {Function} - Express middleware
   */
  authorizeRoles: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        throw new UnauthorizedError(
          'لطفا ابتدا وارد شوید',
          'Please login first'
        );
      }
      
      if (!roles.includes(req.user.role)) {
        throw new UnauthorizedError(
          'شما مجوز دسترسی به این بخش را ندارید',
          'You do not have permission to access this resource'
        );
      }
      
      next();
    };
  }
};

module.exports = auth; 