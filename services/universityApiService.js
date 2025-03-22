const rapidApi = require('./rapidApiService');
const University = require('../models/University');
const { InternalServerError } = require('../utils/errorHandler');

/**
 * Service for interacting with University APIs, including RapidAPI
 */
class UniversityApiService {
  /**
   * Transform university data from various sources to a consistent format
   * @param {Object} data - Raw university data
   * @param {String} source - Source of data
   * @returns {Object} - Transformed university data
   */
  _transformUniversityData(data, source) {
    try {
      // Different transformation logic based on source
      if (source === 'rapidapi') {
        return {
          externalId: data.id || data.university_id || `rapid-${Date.now()}`,
          name: data.name || data.university_name,
          nameEn: data.name_en || data.english_name || data.name,
          field: data.field || data.program || data.study_field,
          fieldEn: data.field_en || data.program_en || data.field,
          degree: data.degree || data.level,
          degreeEn: data.degree_en || data.level_en || data.degree,
          location: data.location || data.city || data.address,
          locationEn: data.location_en || data.city_en || data.location,
          tuition: data.tuition || data.fees || 0,
          currency: data.currency || 'IRR',
          description: data.description || '',
          descriptionEn: data.description_en || data.description,
          website: data.website || data.url || '',
          applicationUrl: data.application_url || data.apply_url || data.website || '',
          deadline: data.deadline || null,
          requirements: data.requirements || [],
          isActive: true,
          source: 'RapidAPI'
        };
      } else {
        // Generic transformation for other sources
        return {
          externalId: data.id || `${source}-${Date.now()}`,
          name: data.name,
          nameEn: data.name_en || data.name,
          field: data.field,
          fieldEn: data.field_en || data.field,
          degree: data.degree,
          degreeEn: data.degree_en || data.degree,
          location: data.location,
          locationEn: data.location_en || data.location,
          tuition: data.tuition || 0,
          currency: data.currency || 'IRR',
          description: data.description || '',
          descriptionEn: data.description_en || data.description,
          website: data.website || '',
          applicationUrl: data.application_url || data.website || '',
          deadline: data.deadline || null,
          requirements: data.requirements || [],
          isActive: true,
          source
        };
      }
    } catch (error) {
      console.error('Error transforming university data:', error);
      throw new InternalServerError(
        'خطا در پردازش داده‌های دانشگاه',
        'Error processing university data'
      );
    }
  }
  
  /**
   * Fetch university data from RapidAPI
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - University data
   */
  async fetchFromRapidApi(params = {}) {
    try {
      // Example RapidAPI host for university data
      const host = 'universities-and-colleges.p.rapidapi.com';
      const url = 'https://universities-and-colleges.p.rapidapi.com/api/search';
      
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
      
      if (!response || !response.universities) {
        return [];
      }
      
      // Transform data
      return response.universities.map(uni => 
        this._transformUniversityData(uni, 'rapidapi')
      );
    } catch (error) {
      console.error('Error fetching university data from RapidAPI:', error);
      return [];
    }
  }
  
  /**
   * Sync university data from multiple sources
   * @returns {Promise<Object>} - Sync result
   */
  async syncUniversityData() {
    try {
      // Get university data from RapidAPI
      console.log('Fetching university data from RapidAPI...');
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
          message: 'No university data received from external sources',
          count: 0
        };
      }
      
      // Process and save data
      let savedCount = 0;
      
      for (const uniData of allData) {
        // Check if university already exists
        let university = await University.findOne({ 
          externalId: uniData.externalId 
        });
        
        if (university) {
          // Update existing record
          Object.assign(university, uniData);
        } else {
          // Create new record
          university = new University(uniData);
          savedCount++;
        }
        
        await university.save();
      }
      
      return {
        success: true,
        message: `University data synced successfully. Added ${savedCount} new records, updated ${allData.length - savedCount} existing records.`,
        count: allData.length
      };
    } catch (error) {
      console.error('Error syncing university data:', error);
      throw new InternalServerError(
        'خطا در همگام‌سازی داده‌های دانشگاه',
        'Error syncing university data'
      );
    }
  }
  
  /**
   * Search for application opportunities on RapidAPI
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} - Application opportunities
   */
  async searchUniversityOpportunities(params = {}) {
    try {
      // Example RapidAPI host for university applications
      const host = 'university-application-api.p.rapidapi.com';
      const url = 'https://university-application-api.p.rapidapi.com/search';
      
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
      
      if (!response || !response.opportunities) {
        return [];
      }
      
      // Return raw data
      return response.opportunities;
    } catch (error) {
      console.error('Error searching university applications:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new UniversityApiService(); 