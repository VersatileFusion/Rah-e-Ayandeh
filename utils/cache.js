const redis = require('redis');
const { promisify } = require('util');

// Redis client configuration
let redisClient;
let getAsync;
let setAsync;
let delAsync;
let keysAsync;

/**
 * Initialize Redis client and promisify methods
 */
const initRedis = async () => {
  try {
    // Create Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient(redisUrl);

    // Promisify Redis methods
    getAsync = promisify(redisClient.get).bind(redisClient);
    setAsync = promisify(redisClient.set).bind(redisClient);
    delAsync = promisify(redisClient.del).bind(redisClient);
    keysAsync = promisify(redisClient.keys).bind(redisClient);

    // Event handlers
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Continue without Redis in case of failure
    return null;
  }
};

/**
 * Get data from cache
 * @param {String} key - Cache key
 * @returns {Object|null} - Cached data or null if not found
 */
const getCache = async (key) => {
  try {
    if (!redisClient || !redisClient.connected) {
      return null;
    }
    
    const cachedData = await getAsync(key);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set data in cache
 * @param {String} key - Cache key
 * @param {Object} data - Data to cache
 * @param {Number} expireTime - Cache expiration time in seconds (default: 1 hour)
 */
const setCache = async (key, data, expireTime = 3600) => {
  try {
    if (!redisClient || !redisClient.connected) {
      return false;
    }
    
    await setAsync(key, JSON.stringify(data), 'EX', expireTime);
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete cache entry
 * @param {String} key - Cache key
 */
const deleteCache = async (key) => {
  try {
    if (!redisClient || !redisClient.connected) {
      return false;
    }
    
    await delAsync(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete all cache entries matching a pattern
 * @param {String} pattern - Key pattern (e.g., 'university:*')
 */
const clearCachePattern = async (pattern) => {
  try {
    if (!redisClient || !redisClient.connected) {
      return false;
    }
    
    const keys = await keysAsync(pattern);
    
    if (keys.length > 0) {
      await delAsync(keys);
    }
    
    return true;
  } catch (error) {
    console.error(`Error clearing cache pattern ${pattern}:`, error);
    return false;
  }
};

/**
 * Middleware to cache API responses
 * @param {Number} duration - Cache duration in seconds
 * @returns {Function} - Express middleware
 */
const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET' || !redisClient || !redisClient.connected) {
      return next();
    }
    
    // Create a unique cache key based on the request
    const cacheKey = `${req.originalUrl}`;
    
    try {
      // Try to get cached response
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        // Return cached response
        return res.json(cachedData);
      }
      
      // Store the original res.json method
      const originalJson = res.json;
      
      // Override res.json method to cache the response
      res.json = function(data) {
        // Cache the data
        setCache(cacheKey, data, duration);
        
        // Call the original res.json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear all cache
 */
const clearAllCache = async () => {
  try {
    if (!redisClient || !redisClient.connected) {
      return false;
    }
    
    await redisClient.flushallAsync();
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  cacheMiddleware,
  clearAllCache
}; 