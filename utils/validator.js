const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Middleware to validate results from express-validator
 * @returns {Function} Express middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg
  }));
  
  const error = new ValidationError('اطلاعات ورودی نامعتبر است', 'Invalid input data');
  error.addValidationErrors(extractedErrors);
  
  return next(error);
};

/**
 * Validation schemas for authentication
 */
const authValidation = {
  register: [
    body('username')
      .trim()
      .notEmpty().withMessage('نام کاربری الزامی است | Username is required')
      .isLength({ min: 3, max: 20 }).withMessage('نام کاربری باید بین 3 تا 20 کاراکتر باشد | Username must be between 3 and 20 characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('ایمیل الزامی است | Email is required')
      .isEmail().withMessage('ایمیل نامعتبر است | Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('رمز عبور الزامی است | Password is required')
      .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل 6 کاراکتر باشد | Password must be at least 6 characters')
      .matches(/\d/).withMessage('رمز عبور باید شامل حداقل یک عدد باشد | Password must contain at least one number'),
    
    body('confirmPassword')
      .trim()
      .notEmpty().withMessage('تایید رمز عبور الزامی است | Confirm password is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('تایید رمز عبور با رمز عبور مطابقت ندارد | Passwords do not match');
        }
        return true;
      }),
    
    validate
  ],
  
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('نام کاربری یا ایمیل الزامی است | Username or email is required'),
    
    body('password')
      .trim()
      .notEmpty().withMessage('رمز عبور الزامی است | Password is required'),
    
    validate
  ],
  
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('نام باید حداقل 2 کاراکتر باشد | First name must be at least 2 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('نام خانوادگی باید حداقل 2 کاراکتر باشد | Last name must be at least 2 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('ایمیل نامعتبر است | Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .optional()
      .trim()
      .isLength({ min: 6 }).withMessage('رمز عبور باید حداقل 6 کاراکتر باشد | Password must be at least 6 characters')
      .matches(/\d/).withMessage('رمز عبور باید شامل حداقل یک عدد باشد | Password must contain at least one number'),
    
    validate
  ]
};

/**
 * Validation schemas for favorites
 */
const favoriteValidation = {
  add: [
    body('id')
      .notEmpty().withMessage('شناسه مورد نیاز است | Item ID is required')
      .isMongoId().withMessage('شناسه نامعتبر است | Invalid ID format'),
    
    body('type')
      .notEmpty().withMessage('نوع مورد نیاز است | Item type is required')
      .isIn(['university', 'job']).withMessage('نوع نامعتبر است | Invalid type (must be university or job)'),
    
    validate
  ],
  
  remove: [
    param('id')
      .notEmpty().withMessage('شناسه مورد نیاز است | Item ID is required')
      .isMongoId().withMessage('شناسه نامعتبر است | Invalid ID format'),
    
    param('type')
      .notEmpty().withMessage('نوع مورد نیاز است | Item type is required')
      .isIn(['university', 'job']).withMessage('نوع نامعتبر است | Invalid type (must be university or job)'),
    
    validate
  ]
};

/**
 * Validation schemas for applications
 */
const applicationValidation = {
  create: [
    body('id')
      .notEmpty().withMessage('شناسه مورد نیاز است | Item ID is required')
      .isMongoId().withMessage('شناسه نامعتبر است | Invalid ID format'),
    
    body('type')
      .notEmpty().withMessage('نوع مورد نیاز است | Item type is required')
      .isIn(['university', 'job']).withMessage('نوع نامعتبر است | Invalid type (must be university or job)'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('یادداشت‌ها نمی‌توانند بیش از 1000 کاراکتر باشند | Notes cannot exceed 1000 characters'),
    
    validate
  ],
  
  update: [
    param('id')
      .notEmpty().withMessage('شناسه مورد نیاز است | Application ID is required')
      .isMongoId().withMessage('شناسه نامعتبر است | Invalid ID format'),
    
    body('status')
      .optional()
      .isIn(['applied', 'in-progress', 'accepted', 'rejected'])
      .withMessage('وضعیت نامعتبر است | Invalid status'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('یادداشت‌ها نمی‌توانند بیش از 1000 کاراکتر باشند | Notes cannot exceed 1000 characters'),
    
    validate
  ]
};

/**
 * Validation schemas for university routes
 */
const universityValidation = {
  search: [
    query('query')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('عبارت جستجو باید حداقل 2 کاراکتر باشد | Search query must be at least 2 characters'),
    
    query('field')
      .optional()
      .trim(),
    
    query('location')
      .optional()
      .trim(),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('شماره صفحه باید عدد صحیح بزرگتر از صفر باشد | Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('تعداد نتایج باید بین 1 تا 100 باشد | Limit must be between 1 and 100'),
    
    validate
  ],
  
  getById: [
    param('id')
      .notEmpty().withMessage('شناسه دانشگاه الزامی است | University ID is required'),
    
    validate
  ]
};

/**
 * Validation schemas for job routes
 */
const jobValidation = {
  search: [
    query('query')
      .optional()
      .trim()
      .isLength({ min: 2 }).withMessage('عبارت جستجو باید حداقل 2 کاراکتر باشد | Search query must be at least 2 characters'),
    
    query('type')
      .optional()
      .trim(),
    
    query('location')
      .optional()
      .trim(),
    
    query('company')
      .optional()
      .trim(),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('شماره صفحه باید عدد صحیح بزرگتر از صفر باشد | Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('تعداد نتایج باید بین 1 تا 100 باشد | Limit must be between 1 and 100'),
    
    validate
  ],
  
  getById: [
    param('id')
      .notEmpty().withMessage('شناسه شغل الزامی است | Job ID is required'),
    
    validate
  ]
};

module.exports = {
  validate,
  authValidation,
  favoriteValidation,
  applicationValidation,
  universityValidation,
  jobValidation
}; 