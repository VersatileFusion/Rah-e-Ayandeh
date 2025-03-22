/**
 * Custom Error Classes
 */
const { logger } = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, errorEn = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorEn = errorEn || message;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 400, errorEn);
  }
}

class UnauthorizedError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 401, errorEn);
  }
}

class ForbiddenError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 403, errorEn);
  }
}

class NotFoundError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 404, errorEn);
  }
}

class ValidationError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 422, errorEn);
    this.validationErrors = null;
  }
  
  addValidationErrors(errors) {
    this.validationErrors = errors;
    return this;
  }
}

class RateLimitError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 429, errorEn);
  }
}

class InternalServerError extends AppError {
  constructor(message, errorEn = null) {
    super(message, 500, errorEn);
  }
}

/**
 * Error handler middleware
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  // Log error
  if (err.statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode || 500
    });
  } else {
    logger.warn(`Client Error: ${err.message}`, {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode || 400
    });
  }
  
  // Default status code and error
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    status: 'error',
    error: err.message || 'خطایی در سرور رخ داده است',
    error_en: err.errorEn || 'An error occurred on the server',
  };
  
  // Add message for user based on environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.message_en = err.message;
    errorResponse.stack = err.stack;
  } else {
    errorResponse.message = statusCode === 500 
      ? 'لطفا با پشتیبانی تماس بگیرید'
      : err.message;
    errorResponse.message_en = statusCode === 500 
      ? 'Please contact support'
      : err.errorEn || err.message;
  }
  
  // Add validation errors if available
  if (err.validationErrors) {
    errorResponse.validationErrors = err.validationErrors;
  }
  
  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
    }));
    errorResponse.error = 'اطلاعات ورودی نامعتبر است';
    errorResponse.error_en = 'Invalid input data';
    errorResponse.validationErrors = errors;
  }
  
  // Handle mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    errorResponse.error = `${field} قبلاً ثبت شده است`;
    errorResponse.error_en = `${field} already exists`;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.error = 'توکن نامعتبر است';
    errorResponse.error_en = 'Invalid token';
    errorResponse.message = 'لطفا دوباره وارد شوید';
    errorResponse.message_en = 'Please login again';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.error = 'توکن منقضی شده است';
    errorResponse.error_en = 'Token expired';
    errorResponse.message = 'لطفا دوباره وارد شوید';
    errorResponse.message_en = 'Please login again';
  }
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler to eliminate try-catch blocks
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  errorHandlerMiddleware,
  asyncHandler
}; 