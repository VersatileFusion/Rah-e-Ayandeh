# راه آینده (Rah-e Ayandeh) API

<div dir="rtl">
راه آینده یک پلتفرم فارسی برای جستجوی برنامه‌های دانشگاهی و فرصت‌های شغلی در ایران است. این پروژه یک API ارائه می‌دهد که داده‌ها را از منابع مختلف جمع‌آوری کرده و به زبان فارسی در اختیار کاربران قرار می‌دهد.
</div>

**Rah-e Ayandeh** is a Persian platform for searching academic programs and job opportunities in Iran. This project provides an API that collects data from various sources and makes it available to users in Persian language.

## ویژگی‌ها | Features

<div dir="rtl">

- **بخش دانشگاه**: دسترسی به برنامه‌های دانشگاهی از منابع مختلف
- **بخش شغلی**: دسترسی به موقعیت‌های شغلی از منابع مختلف
- **جستجو و فیلتر**: امکان جستجو و فیلتر کردن نتایج
- **مستندات API**: دارای مستندات Swagger برای استفاده آسان
- **RTL و فارسی**: پشتیبانی کامل از زبان فارسی و جهت راست به چپ
- **پایگاه داده MongoDB**: ذخیره و بازیابی داده‌ها با استفاده از MongoDB
- **همگام‌سازی خودکار**: همگام‌سازی خودکار داده‌ها از منابع خارجی
- **احراز هویت JWT**: سیستم احراز هویت امن با توکن‌های JWT
- **کش‌گذاری Redis**: بهبود کارایی با کش‌گذاری پاسخ‌های API
- **محدودیت نرخ درخواست**: محافظت در برابر درخواست‌های بیش از حد
- **نسخه‌بندی API**: امکان توسعه بدون شکستن سازگاری عقب‌رو
- **مدیریت علاقه‌مندی‌ها**: امکان ذخیره برنامه‌ها و موقعیت‌های مورد علاقه
- **ثبت لاگ ساختاریافته**: سیستم ثبت لاگ جامع برای نظارت و اشکال‌زدایی
- **مدیریت خطای پیشرفته**: پاسخ‌های خطای استاندارد و دوزبانه
</div>

- **University Section**: Access to academic programs from various sources
- **Job Section**: Access to job opportunities from various sources
- **Search and Filter**: Ability to search and filter results
- **API Documentation**: Swagger documentation for easy use
- **RTL and Persian**: Full support for Persian language and right-to-left direction
- **MongoDB Database**: Data storage and retrieval using MongoDB
- **Automatic Synchronization**: Automatic data synchronization from external sources
- **JWT Authentication**: Secure authentication system with JWT tokens
- **Redis Caching**: Improved performance with API response caching
- **Rate Limiting**: Protection against excessive requests
- **API Versioning**: Ability to evolve without breaking backward compatibility
- **Favorites Management**: Save favorite programs and job opportunities
- **Structured Logging**: Comprehensive logging system for monitoring and debugging
- **Advanced Error Handling**: Standardized and bilingual error responses

## تکنولوژی‌ها | Technologies

<div dir="rtl">

- **زبان برنامه‌نویسی**: JavaScript (Node.js)
- **فریم‌ورک**: Express.js
- **پایگاه داده**: MongoDB + Mongoose
- **مستندات API**: Swagger
- **زمان‌بندی خودکار**: node-cron
- **امنیت**: Helmet، متغیرهای محیطی، CORS، Rate Limiting
- **احراز هویت**: JWT، bcrypt
- **کش‌گذاری**: Redis
- **لاگ و مانیتورینگ**: Winston
- **اعتبارسنجی داده**: Joi
- **منابع داده خارجی**: RapidAPI
</div>

- **Programming Language**: JavaScript (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **API Documentation**: Swagger
- **Automatic Scheduling**: node-cron
- **Security**: Helmet, Environment Variables, CORS, Rate Limiting
- **Authentication**: JWT, bcrypt
- **Caching**: Redis
- **Logging and Monitoring**: Winston
- **Data Validation**: Joi
- **External Data Sources**: RapidAPI

## پیش‌نیازها | Prerequisites

<div dir="rtl">
برای اجرای این پروژه، به موارد زیر نیاز دارید:

- Node.js v14 یا بالاتر
- npm یا yarn برای مدیریت وابستگی‌ها
- MongoDB (نسخه 4.4 یا بالاتر)
- Redis (نسخه 6 یا بالاتر)
- دسترسی به APIهای دانشگاه و شغلی (برای نسخه توسعه، داده‌های شبیه‌سازی شده استفاده می‌شود)
- اکانت RapidAPI (برای دسترسی به منابع داده‌ای)
</div>

To run this project, you need:

- Node.js v14 or higher
- npm or yarn for dependency management
- MongoDB (version 4.4 or higher)
- Redis (version 6 or higher)
- Access to university and job APIs (for development, mock data is used)
- RapidAPI account (for accessing data sources)

## نصب و راه‌اندازی | Installation and Setup

<div dir="rtl">

1. **کلون کردن مخزن**:
   ```bash
   git clone https://github.com/ErfanAhmadvand/rah-e-ayandeh.git
   cd rah-e-ayandeh
   ```

2. **نصب وابستگی‌ها**:
   ```bash
   npm install
   ```

3. **تنظیم MongoDB و Redis**:
   - MongoDB را نصب کنید یا از یک سرویس ابری مانند MongoDB Atlas استفاده کنید
   - Redis را نصب کنید یا از یک سرویس ابری استفاده کنید
   - یک پایگاه داده با نام `rah-e-ayandeh` ایجاد کنید

4. **تنظیم متغیرهای محیطی**:
   فایل `.env` را ویرایش کرده و کلیدهای API و تنظیمات خود را وارد کنید:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/rah-e-ayandeh

   # API Security
   API_KEY=your_api_key_here

   # JWT Authentication
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your_refresh_token_secret_here
   JWT_REFRESH_EXPIRES_IN=7d

   # Redis Cache
   REDIS_URL=redis://localhost:6379

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100

   # Logging
   LOG_LEVEL=debug

   # RapidAPI
   RAPIDAPI_KEY=your_rapidapi_key_here
   RAPIDAPI_HOST=default-rapidapi-host.p.rapidapi.com
   ```

5. **اجرای برنامه در محیط توسعه**:
   ```bash
   npm run dev
   ```

6. **همگام‌سازی داده‌ها**:
   داده‌ها به صورت خودکار در زمان راه‌اندازی همگام‌سازی می‌شوند، اما می‌توانید به صورت دستی نیز این کار را انجام دهید:
   ```bash
   curl -X POST http://localhost:3000/api/sync
   ```

7. **دسترسی به مستندات API**:
   مرورگر خود را باز کرده و به آدرس `http://localhost:3000/api-docs` بروید.
</div>

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ErfanAhmadvand/rah-e-ayandeh.git
   cd rah-e-ayandeh
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up MongoDB and Redis**:
   - Install MongoDB or use a cloud service like MongoDB Atlas
   - Install Redis or use a cloud service
   - Create a database named `rah-e-ayandeh`

4. **Set environment variables**:
   Edit the `.env` file and enter your API keys and settings:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB
   MONGO_URI=mongodb://localhost:27017/rah-e-ayandeh
   
   # API Security
   API_KEY=your_api_key_here

   # JWT Authentication
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your_refresh_token_secret_here
   JWT_REFRESH_EXPIRES_IN=7d

   # Redis Cache
   REDIS_URL=redis://localhost:6379

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100

   # Logging
   LOG_LEVEL=debug

   # RapidAPI
   RAPIDAPI_KEY=your_rapidapi_key_here
   RAPIDAPI_HOST=default-rapidapi-host.p.rapidapi.com
   ```

5. **Run the application in development mode**:
   ```bash
   npm run dev
   ```

6. **Synchronize data**:
   Data is automatically synchronized during startup, but you can also manually trigger synchronization:
   ```bash
   curl -X POST http://localhost:3000/api/sync
   ```

7. **Access API documentation**:
   Open your browser and go to `http://localhost:3000/api-docs`.

## API Endpoints

<div dir="rtl">

### بخش دانشگاه
- `GET /api/v1/university`: دریافت تمام برنامه‌های دانشگاهی
- `GET /api/v1/university/search`: جستجو در برنامه‌های دانشگاهی
- `GET /api/v1/university/:id`: دریافت یک برنامه دانشگاهی با شناسه مشخص
- `GET /api/v1/university/fields`: دریافت تمام رشته‌های تحصیلی
- `GET /api/v1/university/locations`: دریافت تمام موقعیت‌های دانشگاهی
- `GET /api/v1/university/apply`: جستجوی فرصت‌های درخواست دانشگاهی

### بخش شغلی
- `GET /api/v1/job`: دریافت تمام موقعیت‌های شغلی
- `GET /api/v1/job/search`: جستجو در موقعیت‌های شغلی
- `GET /api/v1/job/:id`: دریافت یک موقعیت شغلی با شناسه مشخص
- `GET /api/v1/job/types`: دریافت تمام انواع شغلی
- `GET /api/v1/job/locations`: دریافت تمام موقعیت‌های شغلی
- `GET /api/v1/job/companies`: دریافت تمام شرکت‌ها

### بخش احراز هویت
- `POST /api/v1/auth/register`: ثبت نام کاربر جدید
- `POST /api/v1/auth/login`: ورود کاربر
- `POST /api/v1/auth/refresh-token`: تازه‌سازی توکن دسترسی
- `POST /api/v1/auth/logout`: خروج از سیستم
- `GET /api/v1/auth/profile`: دریافت پروفایل کاربر
- `PUT /api/v1/auth/profile`: به‌روزرسانی پروفایل کاربر
- `POST /api/v1/auth/change-password`: تغییر رمز عبور

### بخش علاقه‌مندی‌ها
- `GET /api/v1/favorite`: دریافت تمام علاقه‌مندی‌های کاربر
- `POST /api/v1/favorite`: افزودن یک مورد به علاقه‌مندی‌ها
- `DELETE /api/v1/favorite/:id`: حذف یک مورد از علاقه‌مندی‌ها

### سایر
- `GET /`: صفحه اصلی API با اطلاعات پایه
- `GET /api-docs`: مستندات Swagger API
- `POST /api/sync`: همگام‌سازی دستی داده‌ها (در محیط تولید نیازمند کلید API)
</div>

### University Section
- `GET /api/v1/university`: Get all university programs
- `GET /api/v1/university/search`: Search university programs
- `GET /api/v1/university/:id`: Get a specific university program by ID
- `GET /api/v1/university/fields`: Get all fields of study
- `GET /api/v1/university/locations`: Get all university locations
- `GET /api/v1/university/apply`: Search university application opportunities

### Job Section
- `GET /api/v1/job`: Get all job opportunities
- `GET /api/v1/job/search`: Search job opportunities
- `GET /api/v1/job/:id`: Get a specific job opportunity by ID
- `GET /api/v1/job/types`: Get all job types
- `GET /api/v1/job/locations`: Get all job locations
- `GET /api/v1/job/companies`: Get all companies

### Authentication
- `POST /api/v1/auth/register`: Register a new user
- `POST /api/v1/auth/login`: User login
- `POST /api/v1/auth/refresh-token`: Refresh access token
- `POST /api/v1/auth/logout`: Logout
- `GET /api/v1/auth/profile`: Get user profile
- `PUT /api/v1/auth/profile`: Update user profile
- `POST /api/v1/auth/change-password`: Change password

### Favorites
- `GET /api/v1/favorite`: Get all user favorites
- `POST /api/v1/favorite`: Add an item to favorites
- `DELETE /api/v1/favorite/:id`: Remove an item from favorites

### Other
- `GET /`: API homepage with basic information
- `GET /api-docs`: Swagger API documentation
- `POST /api/sync`: Manual data synchronization (requires API key in production)

## برای اجرا در محیط تولید | For Production Deployment

<div dir="rtl">

1. **تنظیم متغیرهای محیطی**:
   ```
   NODE_ENV=production
   PORT=3000
   ```

2. **ساخت نسخه نهایی**:
   ```bash
   npm run build
   ```

3. **اجرای برنامه**:
   ```bash
   npm start
   ```
</div>

1. **Set environment variables**:
   ```
   NODE_ENV=production
   PORT=3000
   ```

2. **Build the final version**:
   ```bash
   npm run build
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

## توسعه آینده | Future Development

<div dir="rtl">

- افزودن احراز هویت کاربران
- امکان ذخیره برنامه‌ها و موقعیت‌های مورد علاقه
- سیستم اطلاع‌رسانی برای آخرین برنامه‌ها و موقعیت‌ها
- پشتیبانی از پایگاه داده برای ذخیره اطلاعات کاربران
</div>

- Adding user authentication
- Ability to save favorite programs and job opportunities
- Notification system for latest programs and opportunities
- Database support for storing user information

## توسعه‌دهنده | Developer

<div dir="rtl">

**نام**: عرفان احمدوند  
**تماس**: +98 9109924707  
**ایمیل**: info@rahayandeh.ir
</div>

**Name**: Erfan Ahmadvand  
**Contact**: +98 9109924707  
**Email**: info@rahayandeh.ir

## مجوز | License

<div dir="rtl">
این پروژه تحت مجوز MIT منتشر شده است. 
</div>

This project is published under the MIT license.

## ساختار پروژه | Project Structure

<div dir="rtl">

```
rah-e-ayandeh/
├── config/             # تنظیمات و پیکربندی‌ها
│   └── db.js           # پیکربندی اتصال به MongoDB
├── models/             # مدل‌های Mongoose
│   ├── University.js   # مدل برنامه‌های دانشگاهی
│   └── Job.js          # مدل موقعیت‌های شغلی
├── routes/             # مسیرهای API
│   ├── university.js   # مسیرهای مربوط به برنامه‌های دانشگاهی
│   └── job.js          # مسیرهای مربوط به موقعیت‌های شغلی
├── services/           # سرویس‌ها
│   └── syncService.js  # سرویس همگام‌سازی داده‌ها
├── .env                # متغیرهای محیطی
├── .gitignore          # فایل‌هایی که باید از Git مستثنی شوند
├── LICENSE             # فایل مجوز
├── package.json        # وابستگی‌ها و اسکریپت‌ها
├── README.md           # مستندات پروژه
└── server.js           # فایل اصلی سرور
```
</div>

```
rah-e-ayandeh/
├── config/             # Configuration settings
│   └── db.js           # MongoDB connection configuration
├── models/             # Mongoose models
│   ├── University.js   # University programs model
│   └── Job.js          # Job opportunities model
├── routes/             # API routes
│   ├── university.js   # Routes related to university programs
│   └── job.js          # Routes related to job opportunities
├── services/           # Services
│   └── syncService.js  # Data synchronization service
├── .env                # Environment variables
├── .gitignore          # Files to be ignored by Git
├── LICENSE             # License file
├── package.json        # Dependencies and scripts
├── README.md           # Project documentation
└── server.js           # Main server file
``` 