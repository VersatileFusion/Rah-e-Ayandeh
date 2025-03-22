const express = require('express');
const axios = require('axios');
const router = express.Router();
const Job = require('../models/Job');
const jobApiService = require('../services/jobApiService');
const { jobValidation } = require('../utils/validator');
const { asyncHandler } = require('../utils/errorHandler');
const { NotFoundError } = require('../utils/errorHandler');
const { cacheMiddleware } = require('../utils/cache');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job listings API
 */

/**
 * @swagger
 * /api/v1/job:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all job opportunities
 *     description: Retrieve a list of all active job opportunities
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of job opportunities
 *       500:
 *         description: Server error
 */
router.get('/', cacheMiddleware(1800), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  
  const jobs = await Job.find({ isActive: true })
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Job.countDocuments({ isActive: true });
  
  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: jobs
  });
}));

/**
 * @swagger
 * /api/v1/job/search:
 *   get:
 *     tags:
 *       - Job
 *     summary: Search job opportunities
 *     description: Search job opportunities by query, type, location, and company
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term (job title, description, etc.)
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *         description: Job type (full-time, part-time, etc.)
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Job location
 *       - name: company
 *         in: query
 *         schema:
 *           type: string
 *         description: Company name
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Bad request
 */
router.get('/search', jobValidation.search, cacheMiddleware(1800), asyncHandler(async (req, res) => {
  const { query, type, location, company } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  
  // Build search filter
  const filter = { isActive: true };
  
  // Add text search if query is provided
  if (query && query.trim()) {
    filter.$text = { $search: query.trim() };
  }
  
  // Add type filter if provided
  if (type && type.trim()) {
    filter.type = { $regex: new RegExp(type.trim(), 'i') };
  }
  
  // Add location filter if provided
  if (location && location.trim()) {
    filter.location = { $regex: new RegExp(location.trim(), 'i') };
  }
  
  // Add company filter if provided
  if (company && company.trim()) {
    filter.company = { $regex: new RegExp(company.trim(), 'i') };
  }
  
  // Execute search
  const jobs = await Job.find(filter)
    .sort(query ? { score: { $meta: 'textScore' } } : { postedAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await Job.countDocuments(filter);
  
  res.json({
    success: true,
    query: query || '',
    type: type || '',
    location: location || '',
    company: company || '',
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: jobs
  });
}));

/**
 * @swagger
 * /api/v1/job/{id}:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get job opportunity by ID
 *     description: Retrieve a job opportunity by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Job opportunity ID
 *     responses:
 *       200:
 *         description: Job opportunity
 *       404:
 *         description: Job opportunity not found
 */
router.get('/:id', jobValidation.getById, cacheMiddleware(3600), asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    $or: [
      { _id: req.params.id },
      { externalId: req.params.id }
    ],
    isActive: true
  });
  
  if (!job) {
    throw new NotFoundError(
      'موقعیت شغلی مورد نظر یافت نشد',
      'Job opportunity not found'
    );
  }
  
  res.json({
    success: true,
    data: job
  });
}));

/**
 * @swagger
 * /api/v1/job/types:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all job types
 *     description: Retrieve a list of all unique job types
 *     responses:
 *       200:
 *         description: A list of job types
 */
router.get('/types', cacheMiddleware(86400), asyncHandler(async (req, res) => {
  const types = await Job.distinct('type', { isActive: true });
  
  res.json({
    success: true,
    count: types.length,
    data: types.sort()
  });
}));

/**
 * @swagger
 * /api/v1/job/locations:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all job locations
 *     description: Retrieve a list of all unique job locations
 *     responses:
 *       200:
 *         description: A list of job locations
 */
router.get('/locations', cacheMiddleware(86400), asyncHandler(async (req, res) => {
  const locations = await Job.distinct('location', { isActive: true });
  
  res.json({
    success: true,
    count: locations.length,
    data: locations.sort()
  });
}));

/**
 * @swagger
 * /api/v1/job/companies:
 *   get:
 *     tags:
 *       - Job
 *     summary: Get all companies
 *     description: Retrieve a list of all unique companies offering jobs
 *     responses:
 *       200:
 *         description: A list of companies
 */
router.get('/companies', cacheMiddleware(86400), asyncHandler(async (req, res) => {
  const companies = await Job.distinct('company', { isActive: true });
  
  res.json({
    success: true,
    count: companies.length,
    data: companies.sort()
  });
}));

/**
 * @swagger
 * /api/v1/job/apply:
 *   get:
 *     tags:
 *       - Job
 *     summary: Search for job application opportunities
 *     description: Search for job application opportunities from external sources
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *         description: Job type
 *     responses:
 *       200:
 *         description: Application opportunities
 */
router.get('/apply', asyncHandler(async (req, res) => {
  const { query, type } = req.query;
  
  // Search for job opportunities
  const opportunities = await jobApiService.searchJobOpportunities({
    query: query || '',
    type: type || ''
  });
  
  res.json({
    success: true,
    count: opportunities.length,
    data: opportunities
  });
}));

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - company
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the job
 *         title:
 *           type: string
 *           description: Job title
 *         company:
 *           type: string
 *           description: Company name
 *         location:
 *           type: string
 *           description: Job location
 *         type:
 *           type: string
 *           description: Job type (full-time, part-time, etc.)
 *         salary:
 *           type: string
 *           description: Salary information
 *         description:
 *           type: string
 *           description: Detailed job description
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of job requirements
 *         source:
 *           type: string
 *           description: Source API identifier
 */

// Helper function to fetch data from the first job API
async function fetchJobApi1() {
  try {
    const apiUrl = process.env.JOB_API_URL_1;
    const apiKey = process.env.JOB_API_KEY_1;

    if (!apiUrl || !apiKey) {
      console.warn('Job API 1 configuration missing');
      return []; // Return empty array if API config is missing
    }

    console.log(`Attempting to fetch data from Job API 1: ${apiUrl}`);
    // Actual API call would go here
    // For now, we'll return mock data
    return mockJobApi1Data();
  } catch (error) {
    console.error('Error fetching from Job API 1:', error.message);
    return []; // Return empty array on error
  }
}

// Helper function to fetch data from the second job API
async function fetchJobApi2() {
  try {
    const apiUrl = process.env.JOB_API_URL_2;
    const apiKey = process.env.JOB_API_KEY_2;

    if (!apiUrl || !apiKey) {
      console.warn('Job API 2 configuration missing');
      return []; // Return empty array if API config is missing
    }

    console.log(`Attempting to fetch data from Job API 2: ${apiUrl}`);
    // Actual API call would go here
    // For now, we'll return mock data
    return mockJobApi2Data();
  } catch (error) {
    console.error('Error fetching from Job API 2:', error.message);
    return []; // Return empty array on error
  }
}

// Format data from the first job API
function formatJobData1(apiResponse) {
  console.log('Formatting data from Job API 1');
  // This would normally transform the API response into our standard format
  // For now, we'll assume the mock data is already in our format
  return apiResponse.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salary: job.salary,
    description: job.description,
    requirements: job.requirements,
    source: 'api1'
  }));
}

// Format data from the second job API
function formatJobData2(apiResponse) {
  console.log('Formatting data from Job API 2');
  // This would normally transform the API response into our standard format
  // For now, we'll assume the mock data is already in our format
  return apiResponse.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salary: job.salary,
    description: job.description,
    requirements: job.requirements,
    source: 'api2'
  }));
}

// Mock data for development purposes
function mockJobApi1Data() {
  console.log('Returning mock data for Job API 1');
  return [
    {
      id: 'job1-1',
      title: 'مهندس نرم‌افزار فرانت‌اند',
      company: 'دیجی‌کالا',
      location: 'تهران',
      type: 'تمام وقت',
      salary: '۱۵ تا ۲۰ میلیون تومان',
      description: 'توسعه و پیاده‌سازی رابط کاربری سایت با استفاده از React.js و TypeScript',
      requirements: ['حداقل ۲ سال تجربه فرانت‌اند', 'تسلط به React.js', 'آشنایی با TypeScript']
    },
    {
      id: 'job1-2',
      title: 'برنامه‌نویس بک‌اند',
      company: 'اسنپ',
      location: 'تهران',
      type: 'تمام وقت',
      salary: '۱۸ تا ۲۵ میلیون تومان',
      description: 'توسعه و پیاده‌سازی API های سرویس با استفاده از Node.js و MongoDB',
      requirements: ['حداقل ۳ سال تجربه بک‌اند', 'تسلط به Node.js', 'آشنایی با MongoDB و SQL']
    }
  ];
}

function mockJobApi2Data() {
  console.log('Returning mock data for Job API 2');
  return [
    {
      id: 'job2-1',
      title: 'مدیر محصول',
      company: 'تپسی',
      location: 'تهران',
      type: 'تمام وقت',
      salary: '۲۵ تا ۳۵ میلیون تومان',
      description: 'مدیریت تیم محصول و برنامه‌ریزی توسعه محصولات جدید',
      requirements: ['حداقل ۵ سال تجربه در حوزه محصول', 'تسلط به متدولوژی Agile', 'توانایی کار با تیم‌های چندگانه']
    },
    {
      id: 'job2-2',
      title: 'طراح UX/UI',
      company: 'علی‌بابا',
      location: 'اصفهان',
      type: 'دورکاری',
      salary: '۱۲ تا ۱۸ میلیون تومان',
      description: 'طراحی تجربه کاربری و رابط کاربری برای اپلیکیشن و وب‌سایت',
      requirements: ['حداقل ۲ سال تجربه طراحی UX/UI', 'تسلط به Figma و Adobe XD', 'آشنایی با اصول طراحی کاربرمحور']
    }
  ];
}

// Export the mock functions for use in syncService
module.exports = router;
module.exports.fetchJobApi1Mock = mockJobApi1Data;
module.exports.fetchJobApi2Mock = mockJobApi2Data; 