const express = require('express');
const axios = require('axios');
const router = express.Router();
const University = require('../models/University');
const universityApiService = require('../services/universityApiService');
const { universityValidation } = require('../utils/validator');
const { asyncHandler } = require('../utils/errorHandler');
const { NotFoundError } = require('../utils/errorHandler');
const { cacheMiddleware } = require('../utils/cache');

/**
 * @swagger
 * tags:
 *   name: Universities
 *   description: University programs API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     University:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - university
 *         - field
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the university program
 *         name:
 *           type: string
 *           description: Program name
 *         description:
 *           type: string
 *           description: Detailed program description
 *         university:
 *           type: string
 *           description: University name
 *         field:
 *           type: string
 *           description: Field of study
 *         location:
 *           type: string
 *           description: University location
 *         deadline:
 *           type: string
 *           description: Application deadline
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of requirements for applying
 *         source:
 *           type: string
 *           description: Source API identifier
 */

/**
 * @swagger
 * /api/v1/university:
 *   get:
 *     tags:
 *       - University
 *     summary: Get all university programs
 *     description: Retrieve a list of all university programs
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
 *         description: A list of university programs
 *       500:
 *         description: Server error
 */
router.get('/', cacheMiddleware(1800), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  
  const programs = await University.find()
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);
  
  const total = await University.countDocuments();
  
  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: programs
  });
}));

/**
 * @swagger
 * /api/v1/university/search:
 *   get:
 *     tags:
 *       - University
 *     summary: Search university programs
 *     description: Search university programs by query, field, and location
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term (university name, program, etc.)
 *       - name: field
 *         in: query
 *         schema:
 *           type: string
 *         description: Field of study
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: University location
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
router.get('/search', universityValidation.search, cacheMiddleware(1800), asyncHandler(async (req, res) => {
  const { query, field, location } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  
  // Build search filter
  const filter = {};
  
  // Add text search if query is provided
  if (query && query.trim()) {
    filter.$text = { $search: query.trim() };
  }
  
  // Add field filter if provided
  if (field && field.trim()) {
    filter.field = { $regex: new RegExp(field.trim(), 'i') };
  }
  
  // Add location filter if provided
  if (location && location.trim()) {
    filter.location = { $regex: new RegExp(location.trim(), 'i') };
  }
  
  // Execute search
  const programs = await University.find(filter)
    .sort(query ? { score: { $meta: 'textScore' } } : { name: 1 })
    .skip(skip)
    .limit(limit);
  
  const total = await University.countDocuments(filter);
  
  res.json({
    success: true,
    query: query || '',
    field: field || '',
    location: location || '',
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: programs
  });
}));

/**
 * @swagger
 * /api/v1/university/{id}:
 *   get:
 *     tags:
 *       - University
 *     summary: Get university program by ID
 *     description: Retrieve a university program by its ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: University program ID
 *     responses:
 *       200:
 *         description: University program
 *       404:
 *         description: University program not found
 */
router.get('/:id', universityValidation.getById, cacheMiddleware(3600), asyncHandler(async (req, res) => {
  const program = await University.findOne({
    $or: [
      { _id: req.params.id },
      { externalId: req.params.id }
    ]
  });
  
  if (!program) {
    throw new NotFoundError(
      'برنامه دانشگاهی مورد نظر یافت نشد',
      'University program not found'
    );
  }
  
  res.json({
    success: true,
    data: program
  });
}));

/**
 * @swagger
 * /api/v1/university/fields:
 *   get:
 *     tags:
 *       - University
 *     summary: Get all fields of study
 *     description: Retrieve a list of all unique fields of study
 *     responses:
 *       200:
 *         description: A list of fields of study
 */
router.get('/fields', cacheMiddleware(86400), asyncHandler(async (req, res) => {
  const fields = await University.distinct('field');
  
  res.json({
    success: true,
    count: fields.length,
    data: fields.sort()
  });
}));

/**
 * @swagger
 * /api/v1/university/locations:
 *   get:
 *     tags:
 *       - University
 *     summary: Get all university locations
 *     description: Retrieve a list of all unique university locations
 *     responses:
 *       200:
 *         description: A list of university locations
 */
router.get('/locations', cacheMiddleware(86400), asyncHandler(async (req, res) => {
  const locations = await University.distinct('location');
  
  res.json({
    success: true,
    count: locations.length,
    data: locations.sort()
  });
}));

/**
 * @swagger
 * /api/v1/university/apply:
 *   get:
 *     tags:
 *       - University
 *     summary: Search for university application opportunities
 *     description: Search for university application opportunities from external sources
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term
 *       - name: field
 *         in: query
 *         schema:
 *           type: string
 *         description: Field of study
 *     responses:
 *       200:
 *         description: Application opportunities
 */
router.get('/apply', asyncHandler(async (req, res) => {
  const { query, field } = req.query;
  
  // Search for university opportunities
  const opportunities = await universityApiService.searchUniversityOpportunities({
    query: query || '',
    field: field || ''
  });
  
  res.json({
    success: true,
    count: opportunities.length,
    data: opportunities
  });
}));

// Helper function to fetch data from the first university API
async function fetchUniversityApi1() {
  try {
    const apiUrl = process.env.UNIVERSITY_API_URL_1;
    const apiKey = process.env.UNIVERSITY_API_KEY_1;

    if (!apiUrl || !apiKey) {
      console.warn('University API 1 configuration missing');
      return []; // Return empty array if API config is missing
    }

    console.log(`Attempting to fetch data from University API 1: ${apiUrl}`);
    // Actual API call would go here
    // For now, we'll return mock data
    return mockUniversityApi1Data();
  } catch (error) {
    console.error('Error fetching from University API 1:', error.message);
    return []; // Return empty array on error
  }
}

// Helper function to fetch data from the second university API
async function fetchUniversityApi2() {
  try {
    const apiUrl = process.env.UNIVERSITY_API_URL_2;
    const apiKey = process.env.UNIVERSITY_API_KEY_2;

    if (!apiUrl || !apiKey) {
      console.warn('University API 2 configuration missing');
      return []; // Return empty array if API config is missing
    }

    console.log(`Attempting to fetch data from University API 2: ${apiUrl}`);
    // Actual API call would go here
    // For now, we'll return mock data
    return mockUniversityApi2Data();
  } catch (error) {
    console.error('Error fetching from University API 2:', error.message);
    return []; // Return empty array on error
  }
}

// Format data from the first university API
function formatUniversityData1(apiResponse) {
  console.log('Formatting data from University API 1');
  // This would normally transform the API response into our standard format
  // For now, we'll assume the mock data is already in our format
  return apiResponse.map(program => ({
    id: program.id,
    name: program.name,
    description: program.description,
    university: program.university,
    field: program.field,
    location: program.location,
    deadline: program.deadline,
    requirements: program.requirements,
    source: 'api1'
  }));
}

// Format data from the second university API
function formatUniversityData2(apiResponse) {
  console.log('Formatting data from University API 2');
  // This would normally transform the API response into our standard format
  // For now, we'll assume the mock data is already in our format
  return apiResponse.map(program => ({
    id: program.id,
    name: program.name,
    description: program.description,
    university: program.university,
    field: program.field,
    location: program.location,
    deadline: program.deadline,
    requirements: program.requirements,
    source: 'api2'
  }));
}

// Mock data for development purposes
function mockUniversityApi1Data() {
  console.log('Returning mock data for University API 1');
  return [
    {
      id: 'uni1-prog1',
      name: 'مهندسی کامپیوتر',
      description: 'برنامه کارشناسی مهندسی کامپیوتر با تمرکز بر برنامه نویسی و طراحی نرم افزار',
      university: 'دانشگاه تهران',
      field: 'مهندسی',
      location: 'تهران',
      deadline: '1402/05/15',
      requirements: ['معدل بالای 16', 'قبولی در آزمون ورودی']
    },
    {
      id: 'uni1-prog2',
      name: 'مهندسی برق',
      description: 'برنامه کارشناسی مهندسی برق با تمرکز بر الکترونیک و مدارهای مجتمع',
      university: 'دانشگاه صنعتی شریف',
      field: 'مهندسی',
      location: 'تهران',
      deadline: '1402/05/20',
      requirements: ['معدل بالای 17', 'قبولی در آزمون ورودی']
    }
  ];
}

function mockUniversityApi2Data() {
  console.log('Returning mock data for University API 2');
  return [
    {
      id: 'uni2-prog1',
      name: 'علوم داده',
      description: 'دوره کارشناسی ارشد علوم داده با تمرکز بر یادگیری ماشین و هوش مصنوعی',
      university: 'دانشگاه صنعتی اصفهان',
      field: 'علوم کامپیوتر',
      location: 'اصفهان',
      deadline: '1402/06/10',
      requirements: ['مدرک کارشناسی مرتبط', 'نمره زبان انگلیسی']
    },
    {
      id: 'uni2-prog2',
      name: 'مدیریت بازرگانی',
      description: 'دوره کارشناسی مدیریت بازرگانی با تمرکز بر بازاریابی و تجارت بین الملل',
      university: 'دانشگاه شیراز',
      field: 'مدیریت',
      location: 'شیراز',
      deadline: '1402/06/15',
      requirements: ['معدل بالای 15', 'قبولی در مصاحبه']
    }
  ];
}

module.exports = router;
module.exports.fetchUniversityApi1Mock = mockUniversityApi1Data;
module.exports.fetchUniversityApi2Mock = mockUniversityApi2Data; 