require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { syncAllData, scheduleSync } = require('./services/syncService');
const { errorHandlerMiddleware } = require('./utils/errorHandler');
const { initRedis } = require('./utils/cache');
const { logger, httpLogger } = require('./utils/logger');
const universityRouter = require('./routes/university');
const jobRouter = require('./routes/job');
const authRouter = require('./routes/auth');
const favoriteRouter = require('./routes/favorite');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().then(() => {
  logger.info('MongoDB connected, initializing data sync...');
  
  // Do initial data sync
  syncAllData().then(result => {
    logger.info('Initial data sync completed:', 
      result.success ? 'Success' : 'Failed');
    
    // Schedule daily sync (at 2 AM)
    scheduleSync('0 2 * * *');
  });
});

// Initialize Redis for caching
initRedis().then(() => {
  logger.info('Redis cache initialized');
}).catch(err => {
  logger.error('Failed to initialize Redis cache:', { error: err.message });
});

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // Default: 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Default: 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: 'تعداد درخواست‌ها بیش از حد مجاز است',
    error_en: 'Too many requests',
    message: 'لطفا کمی صبر کنید و دوباره تلاش کنید',
    message_en: 'Please wait a while and try again'
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'راه آینده API',
      version: '1.0.0',
      description: 'API برای سایت راه آینده که اطلاعات دانشگاه‌ها و مشاغل را ارائه می‌دهد',
      contact: {
        name: 'Erfan Ahmadvand',
        phone: '+98 9109924707',
        email: 'info@rahayandeh.ir'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for Swagger UI
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(httpLogger);

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// API routes
app.use('/api/v1/university', universityRouter);
app.use('/api/v1/job', jobRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/favorite', favoriteRouter);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'به API راه آینده خوش آمدید',
    message_en: 'Welcome to Rah-e Ayandeh API',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// Sync data route (protected in production)
app.post('/api/sync', async (req, res, next) => {
  console.log('Manual sync requested');
  
  try {
    if (process.env.NODE_ENV === 'production' && !req.headers['x-api-key']) {
      return res.status(401).json({ 
        success: false, 
        error: 'کلید API الزامی است',
        error_en: 'API key required',
        message: 'برای همگام‌سازی در محیط تولید، کلید API مورد نیاز است',
        message_en: 'API key required for sync in production' 
      });
    }
    
    if (process.env.NODE_ENV === 'production' && req.headers['x-api-key'] !== process.env.API_KEY) {
      return res.status(403).json({ 
        success: false, 
        error: 'کلید API نامعتبر است',
        error_en: 'Invalid API key',
        message: 'کلید API ارائه شده معتبر نیست',
        message_en: 'The provided API key is invalid' 
      });
    }
    
    const result = await syncAllData();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 404 handler - This should be after all routes
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  error.message = 'مسیر مورد نظر یافت نشد';
  error.errorEn = 'Route not found';
  next(error);
});

// Error handling middleware
app.use(errorHandlerMiddleware);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app; 