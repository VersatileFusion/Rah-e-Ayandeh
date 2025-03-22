const rapidApi = require('./rapidApiService');
const Job = require('../models/Job');
const { InternalServerError } = require('../utils/errorHandler');

/**
 * Service for interacting with Job APIs, including RapidAPI
 */
class JobApiService {
  /**
   * Transform job data from various sources to a consistent format
   * @param {Object} data - Raw job data
   * @param {String} source - Source of data
   * @returns {Object} - Transformed job data
   */
  _transformJobData(data, source) {
    try {
      // Different transformation logic based on source
      if (source === 'rapidapi') {
        return {
          externalId: data.id || data.job_id || `rapid-${Date.now()}`,
          title: data.title || data.position || data.job_title,
          titleEn: data.title_en || data.position_en || data.title,
          company: data.company || data.employer || '',
          companyEn: data.company_en || data.employer_en || data.company || '',
          type: data.type || data.job_type || 'full-time',
          typeEn: data.type_en || data.job_type_en || data.type || 'full-time',
          location: data.location || data.city || data.address || '',
          locationEn: data.location_en || data.city_en || data.location || '',
          salary: data.salary || 0,
          salaryCurrency: data.salary_currency || 'IRR',
          salaryPeriod: data.salary_period || 'monthly',
          description: data.description || '',
          descriptionEn: data.description_en || data.description || '',
          requirements: data.requirements || [],
          requirementsEn: data.requirements_en || data.requirements || [],
          benefits: data.benefits || [],
          benefitsEn: data.benefits_en || data.benefits || [],
          contactEmail: data.contact_email || data.email || '',
          contactPhone: data.contact_phone || data.phone || '',
          websiteUrl: data.website_url || data.website || data.url || '',
          applicationUrl: data.application_url || data.apply_url || data.url || '',
          postedAt: data.posted_at || data.posted_date || new Date(),
          deadline: data.deadline || null,
          isRemote: data.is_remote || data.remote || false,
          isActive: true,
          source: 'RapidAPI'
        };
      } else {
        // Generic transformation for other sources
        return {
          externalId: data.id || `${source}-${Date.now()}`,
          title: data.title,
          titleEn: data.title_en || data.title,
          company: data.company || '',
          companyEn: data.company_en || data.company || '',
          type: data.type || 'full-time',
          typeEn: data.type_en || data.type || 'full-time',
          location: data.location || '',
          locationEn: data.location_en || data.location || '',
          salary: data.salary || 0,
          salaryCurrency: data.salary_currency || 'IRR',
          salaryPeriod: data.salary_period || 'monthly',
          description: data.description || '',
          descriptionEn: data.description_en || data.description || '',
          requirements: data.requirements || [],
          requirementsEn: data.requirements_en || data.requirements || [],
          benefits: data.benefits || [],
          benefitsEn: data.benefits_en || data.benefits || [],
          contactEmail: data.contact_email || data.email || '',
          contactPhone: data.contact_phone || data.phone || '',
          websiteUrl: data.website_url || data.website || data.url || '',
          applicationUrl: data.application_url || data.apply_url || data.url || '',
          postedAt: data.posted_at || data.posted_date || new Date(),
          deadline: data.deadline || null,
          isRemote: data.is_remote || data.remote || false,
          isActive: true,
          source
        };
      }
    } catch (error) {
      console.error('Error transforming job data:', error);
      throw new InternalServerError(
        'خطا در پردازش داده‌های شغلی',
        'Error processing job data'
      );
    }
  }
  
  /**
   * Fetch job data from RapidAPI
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - Job data
   */
  async fetchFromRapidApi(params = {}) {
    try {
      // Example RapidAPI host for job data
      const host = 'jobs-api.p.rapidapi.com';
      const url = 'https://jobs-api.p.rapidapi.com/api/jobs/search';
      
      // Set default search parameters
      const searchParams = {
        country: 'iran',
        language: 'fa',
        ...params
      };
      
      // Fetch data from RapidAPI
      const response = await rapidApi
        .setHost(host)
        .get(url, searchParams);
      
      if (!response || !response.jobs) {
        return [];
      }
      
      // Transform data
      return response.jobs.map(job => 
        this._transformJobData(job, 'rapidapi')
      );
    } catch (error) {
      console.error('Error fetching job data from RapidAPI:', error);
      return [];
    }
  }
  
  /**
   * Sync job data from multiple sources
   * @returns {Promise<Object>} - Sync result
   */
  async syncJobData() {
    try {
      // Get job data from RapidAPI
      console.log('Fetching job data from RapidAPI...');
      const rapidApiData = await this.fetchFromRapidApi();
      
      // Get other sources (implement as needed)
      
      // Combine data from all sources
      const allData = [
        ...rapidApiData,
        // Add other sources here
      ];
      
      if (allData.length === 0) {
        return {
          success: false,
          message: 'No job data received from external sources',
          count: 0
        };
      }
      
      // Process and save data
      let savedCount = 0;
      
      for (const jobData of allData) {
        // Check if job already exists
        let job = await Job.findOne({ 
          externalId: jobData.externalId 
        });
        
        if (job) {
          // Update existing record
          Object.assign(job, jobData);
        } else {
          // Create new record
          job = new Job(jobData);
          savedCount++;
        }
        
        await job.save();
      }
      
      return {
        success: true,
        message: `Job data synced successfully. Added ${savedCount} new records, updated ${allData.length - savedCount} existing records.`,
        count: allData.length
      };
    } catch (error) {
      console.error('Error syncing job data:', error);
      throw new InternalServerError(
        'خطا در همگام‌سازی داده‌های شغلی',
        'Error syncing job data'
      );
    }
  }
  
  /**
   * Search for job application opportunities on RapidAPI
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - Application opportunities
   */
  async searchJobOpportunities(params = {}) {
    try {
      // Example RapidAPI host for job opportunities
      const host = 'job-search-api.p.rapidapi.com';
      const url = 'https://job-search-api.p.rapidapi.com/search';
      
      // Set default search parameters
      const searchParams = {
        country: 'iran',
        language: 'fa',
        ...params
      };
      
      // Fetch data from RapidAPI
      const response = await rapidApi
        .setHost(host)
        .get(url, searchParams);
      
      if (!response || !response.jobs) {
        return [];
      }
      
      // Return raw data
      return response.jobs;
    } catch (error) {
      console.error('Error searching job opportunities:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new JobApiService(); 