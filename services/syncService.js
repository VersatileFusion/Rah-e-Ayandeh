const cron = require('node-cron');
const universityApiService = require('./universityApiService');
const jobApiService = require('./jobApiService');
const { clearCachePattern } = require('../utils/cache');
const { InternalServerError } = require('../utils/errorHandler');

/**
 * Synchronize all data from external APIs
 * @returns {Promise<Object>} - Result of sync operation
 */
const syncAllData = async () => {
  console.log('Starting data synchronization...');
  
  try {
    // Sync university data
    console.log('Syncing university data...');
    const universityResult = await universityApiService.syncUniversityData();
    
    // Sync job data
    console.log('Syncing job data...');
    const jobResult = await jobApiService.syncJobData();
    
    // Clear cache after sync
    await clearCachePattern('university:*');
    await clearCachePattern('job:*');
    
    return {
      success: universityResult.success && jobResult.success,
      results: {
        university: universityResult,
        job: jobResult
      },
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error during data synchronization:', error);
    throw new InternalServerError(
      'خطا در همگام‌سازی داده‌ها',
      'Error synchronizing data'
    );
  }
};

/**
 * Schedule periodic data synchronization
 * @param {String} cronExpression - Cron expression for scheduling (default: daily at 3 AM)
 * @returns {cron.ScheduledTask} - Scheduled task
 */
const scheduleSync = (cronExpression = '0 3 * * *') => {
  console.log(`Scheduling data sync with cron expression: ${cronExpression}`);
  
  const task = cron.schedule(cronExpression, async () => {
    console.log(`Running scheduled data sync at ${new Date().toISOString()}`);
    
    try {
      await syncAllData();
      console.log('Scheduled data sync completed successfully');
    } catch (error) {
      console.error('Error in scheduled data sync:', error);
    }
  });
  
  return task;
};

module.exports = {
  syncAllData,
  scheduleSync
}; 