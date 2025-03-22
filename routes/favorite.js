const express = require('express');
const User = require('../models/User');
const University = require('../models/University');
const Job = require('../models/Job');
const { authMiddleware } = require('../utils/auth');
const { favoriteValidation } = require('../utils/validator');
const { asyncHandler } = require('../utils/errorHandler');
const { BadRequestError, NotFoundError } = require('../utils/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get user favorites
 *     description: Get a list of user's favorite universities and jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User favorites
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('favorites.universities')
    .populate('favorites.jobs');
  
  if (!user) {
    throw new NotFoundError('کاربر یافت نشد', 'User not found');
  }
  
  res.json({
    success: true,
    favorites: {
      universities: user.favorites.universities || [],
      jobs: user.favorites.jobs || []
    }
  });
}));

/**
 * @swagger
 * /api/v1/favorites/add:
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Add an item to favorites
 *     description: Add a university or job to user's favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - type
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [university, job]
 *     responses:
 *       200:
 *         description: Added to favorites successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.post('/add', authMiddleware, favoriteValidation.add, asyncHandler(async (req, res) => {
  const { id, type } = req.body;
  let item;
  
  // Find item based on type
  if (type === 'university') {
    item = await University.findById(id);
  } else if (type === 'job') {
    item = await Job.findById(id);
  }
  
  if (!item) {
    throw new NotFoundError(
      'مورد مورد نظر یافت نشد',
      'Item not found'
    );
  }
  
  // Find user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('کاربر یافت نشد', 'User not found');
  }
  
  // Check if already in favorites
  if (type === 'university') {
    if (user.favorites.universities.includes(id)) {
      throw new BadRequestError(
        'این دانشگاه قبلاً به علاقه‌مندی‌ها اضافه شده است',
        'This university is already in favorites'
      );
    }
    user.favorites.universities.push(id);
  } else if (type === 'job') {
    if (user.favorites.jobs.includes(id)) {
      throw new BadRequestError(
        'این شغل قبلاً به علاقه‌مندی‌ها اضافه شده است',
        'This job is already in favorites'
      );
    }
    user.favorites.jobs.push(id);
  }
  
  // Save user
  await user.save();
  
  res.json({
    success: true,
    message: 'با موفقیت به علاقه‌مندی‌ها اضافه شد',
    message_en: 'Added to favorites successfully'
  });
}));

/**
 * @swagger
 * /api/v1/favorites/{type}/{id}:
 *   delete:
 *     tags:
 *       - Favorites
 *     summary: Remove from favorites
 *     description: Remove a university or job from user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [university, job]
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from favorites successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found in favorites
 */
router.delete('/:type/:id', authMiddleware, favoriteValidation.remove, asyncHandler(async (req, res) => {
  const { id, type } = req.params;
  
  // Find user
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new NotFoundError('کاربر یافت نشد', 'User not found');
  }
  
  // Remove from favorites
  let removed = false;
  
  if (type === 'university') {
    if (user.favorites.universities.includes(id)) {
      user.favorites.universities = user.favorites.universities.filter(
        item => item.toString() !== id
      );
      removed = true;
    }
  } else if (type === 'job') {
    if (user.favorites.jobs.includes(id)) {
      user.favorites.jobs = user.favorites.jobs.filter(
        item => item.toString() !== id
      );
      removed = true;
    }
  }
  
  if (!removed) {
    throw new NotFoundError(
      'این مورد در علاقه‌مندی‌های شما یافت نشد',
      'Item not found in your favorites'
    );
  }
  
  // Save user
  await user.save();
  
  res.json({
    success: true,
    message: 'با موفقیت از علاقه‌مندی‌ها حذف شد',
    message_en: 'Removed from favorites successfully'
  });
}));

module.exports = router; 