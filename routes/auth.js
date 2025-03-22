const express = require('express');
const User = require('../models/User');
const auth = require('../utils/auth');
const { authValidation } = require('../utils/validator');
const { asyncHandler } = require('../utils/errorHandler');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request - Invalid data
 *       409:
 *         description: Username or email already exists
 */
router.post('/register', authValidation.register, asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  // Check if username or email already exists
  const existingUser = await User.findOne({ 
    $or: [{ username }, { email }] 
  });
  
  if (existingUser) {
    throw new BadRequestError(
      'نام کاربری یا ایمیل قبلاً ثبت شده است', 
      'Username or email already exists'
    );
  }
  
  // Create new user
  const user = new User({
    username,
    email,
    password,
    firstName,
    lastName
  });
  
  await user.save();
  
  logger.info('New user registered', { username, email });
  
  // Generate tokens
  const accessToken = auth.generateAccessToken(user);
  const refreshToken = await auth.generateRefreshToken(user);
  
  // Return user and tokens
  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    },
    accessToken,
    refreshToken
  });
}));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login to user account
 *     description: Authenticate a user and return access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authValidation.login, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Find user by username or email
  const user = await User.findOne({ 
    $or: [
      { username },
      { email: username } // Allow login with email too
    ]
  });
  
  if (!user) {
    throw new UnauthorizedError(
      'نام کاربری یا رمز عبور نادرست است',
      'Invalid username or password'
    );
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedError(
      'نام کاربری یا رمز عبور نادرست است',
      'Invalid username or password'
    );
  }
  
  // Update last login
  user.lastLogin = Date.now();
  await user.save();
  
  logger.info('User logged in', { userId: user._id, username: user.username });
  
  // Generate tokens
  const accessToken = auth.generateAccessToken(user);
  const refreshToken = await auth.generateRefreshToken(user);
  
  // Return user and tokens
  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    },
    accessToken,
    refreshToken
  });
}));

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Use refresh token to get a new access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new BadRequestError(
      'توکن بازیابی الزامی است',
      'Refresh token is required'
    );
  }
  
  // Verify refresh token
  const decoded = await auth.verifyRefreshToken(refreshToken);
  
  // Find user
  const user = await User.findById(decoded.id);
  
  if (!user) {
    throw new NotFoundError(
      'کاربر یافت نشد',
      'User not found'
    );
  }
  
  // Generate new access token
  const accessToken = auth.generateAccessToken(user);
  
  logger.debug('Access token refreshed', { userId: user._id });
  
  res.json({
    success: true,
    accessToken
  });
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Invalidate refresh token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new BadRequestError(
      'توکن بازیابی الزامی است',
      'Refresh token is required'
    );
  }
  
  // Invalidate refresh token
  await auth.invalidateRefreshToken(req.user.id);
  
  logger.info('User logged out', { userId: req.user.id });
  
  res.json({
    success: true,
    message: 'خروج با موفقیت انجام شد',
    message_en: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get user profile
 *     description: Get current user profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', auth.authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new NotFoundError(
      'کاربر یافت نشد',
      'User not found'
    );
  }
  
  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     tags:
 *       - Authentication
 *     summary: Update user profile
 *     description: Update current user profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', auth.authenticateToken, authValidation.updateProfile, asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  
  // Find user
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new NotFoundError(
      'کاربر یافت نشد',
      'User not found'
    );
  }
  
  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      throw new BadRequestError(
        'این ایمیل قبلاً ثبت شده است',
        'Email already in use'
      );
    }
    
    user.email = email;
  }
  
  // Update fields if provided
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  
  await user.save();
  
  logger.info('User profile updated', { userId: user._id });
  
  res.json({
    success: true,
    message: 'پروفایل با موفقیت به‌روز شد',
    message_en: 'Profile updated successfully',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change user password
 *     description: Update current user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', auth.authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new BadRequestError(
      'تمام فیلدها الزامی هستند',
      'All fields are required'
    );
  }
  
  if (newPassword !== confirmPassword) {
    throw new BadRequestError(
      'تایید رمز عبور با رمز عبور جدید مطابقت ندارد',
      'New password and confirmation do not match'
    );
  }
  
  if (newPassword.length < 6) {
    throw new BadRequestError(
      'رمز عبور جدید باید حداقل 6 کاراکتر باشد',
      'New password must be at least 6 characters'
    );
  }
  
  // Find user
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new NotFoundError(
      'کاربر یافت نشد',
      'User not found'
    );
  }
  
  // Check current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isPasswordValid) {
    throw new UnauthorizedError(
      'رمز عبور فعلی نادرست است',
      'Current password is incorrect'
    );
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Invalidate all refresh tokens for this user
  await auth.invalidateRefreshToken(user._id);
  
  logger.info('User password changed', { userId: user._id });
  
  res.json({
    success: true,
    message: 'رمز عبور با موفقیت تغییر کرد',
    message_en: 'Password changed successfully'
  });
}));

module.exports = router; 