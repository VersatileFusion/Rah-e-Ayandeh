const axios = require('axios');
const { BadRequestError, InternalServerError } = require('../utils/errorHandler');

/**
 * Service for interacting with RapidAPI endpoints
 */
class RapidApiService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    
    if (!this.apiKey) {
      console.warn('Warning: RAPIDAPI_KEY is not set in environment variables');
    }
    
    this.axios = axios.create({
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': '',
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Set the RapidAPI host for the request
   * @param {String} host - RapidAPI host
   * @returns {RapidApiService} - Instance for chaining
   */
  setHost(host) {
    this.axios.defaults.headers['x-rapidapi-host'] = host;
    return this;
  }
  
  /**
   * Make a GET request to RapidAPI
   * @param {String} url - Endpoint URL
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response data
   */
  async get(url, params = {}) {
    try {
      if (!this.apiKey) {
        throw new BadRequestError(
          'کلید RapidAPI تنظیم نشده است',
          'RapidAPI key is not configured'
        );
      }
      
      const response = await this.axios.get(url, { params });
      return response.data;
    } catch (error) {
      this._handleApiError(error);
    }
  }
  
  /**
   * Make a POST request to RapidAPI
   * @param {String} url - Endpoint URL
   * @param {Object} data - Request body
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response data
   */
  async post(url, data = {}, params = {}) {
    try {
      if (!this.apiKey) {
        throw new BadRequestError(
          'کلید RapidAPI تنظیم نشده است',
          'RapidAPI key is not configured'
        );
      }
      
      const response = await this.axios.post(url, data, { params });
      return response.data;
    } catch (error) {
      this._handleApiError(error);
    }
  }
  
  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @private
   */
  _handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data.message || 'API error';
      
      if (status === 400) {
        throw new BadRequestError(
          `خطای API: ${message}`,
          `API error: ${message}`
        );
      } else if (status === 401) {
        throw new BadRequestError(
          'کلید API نامعتبر است',
          'Invalid API key'
        );
      } else if (status === 429) {
        throw new BadRequestError(
          'محدودیت تعداد درخواست‌ها به RapidAPI',
          'Rate limit exceeded for RapidAPI'
        );
      } else {
        throw new InternalServerError(
          `خطای API با کد ${status}: ${message}`,
          `API error ${status}: ${message}`
        );
      }
    } else if (error.request) {
      // Request was made but no response
      throw new InternalServerError(
        'خطای ارتباط با RapidAPI',
        'No response received from RapidAPI'
      );
    } else {
      // Request setup error
      throw new InternalServerError(
        `خطای داخلی: ${error.message}`,
        `Internal error: ${error.message}`
      );
    }
  }
}

// Export singleton instance
module.exports = new RapidApiService(); 