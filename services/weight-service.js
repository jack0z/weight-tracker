/**
 * Service for handling weight entry API calls
 */
class WeightService {
  constructor() {
    this.apiBase = '/api';
    this.entriesEndpoint = `${this.apiBase}/weight-entries`;
    this.statsEndpoint = `${this.apiBase}/weight-stats`;
  }

  /**
   * Get all weight entries with optional filters
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date in YYYY-MM-DD format
   * @param {string} options.endDate - End date in YYYY-MM-DD format
   * @param {number} options.limit - Maximum number of entries to return
   * @param {number} options.page - Page number for pagination
   * @returns {Promise<Object>} - Entries and pagination data
   */
  async getEntries(options = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.page) queryParams.append('page', options.page);
      
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${this.entriesEndpoint}?${queryString}` 
        : this.entriesEndpoint;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }

  /**
   * Get a single weight entry by ID
   * @param {string} entryId - The entry ID
   * @returns {Promise<Object>} - The entry data
   */
  async getEntry(entryId) {
    try {
      const response = await fetch(`${this.entriesEndpoint}/${entryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch entry: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new weight entry
   * @param {Object} data - The entry data
   * @param {string} data.date - Date in YYYY-MM-DD format
   * @param {number} data.weight - Weight value
   * @param {string} [data.note] - Optional note
   * @returns {Promise<Object>} - The created entry
   */
  async createEntry(data) {
    try {
      const response = await fetch(this.entriesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create entry: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }

  /**
   * Update an existing weight entry
   * @param {string} entryId - The entry ID
   * @param {Object} data - The updated data
   * @param {string} [data.date] - Updated date
   * @param {number} [data.weight] - Updated weight
   * @param {string} [data.note] - Updated note
   * @returns {Promise<Object>} - The updated entry
   */
  async updateEntry(entryId, data) {
    try {
      const response = await fetch(`${this.entriesEndpoint}/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update entry: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a weight entry
   * @param {string} entryId - The entry ID to delete
   * @returns {Promise<Object>} - The deletion result
   */
  async deleteEntry(entryId) {
    try {
      const response = await fetch(`${this.entriesEndpoint}/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete entry: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Get weight statistics
   * @param {Object} options - Query options
   * @param {string} [options.period] - Time period ('7d', '14d', '30d', '90d', '1y', 'all')
   * @param {string} [options.startDate] - Custom start date (YYYY-MM-DD)
   * @param {string} [options.endDate] - Custom end date (YYYY-MM-DD)
   * @param {number} [options.forecastDays] - Number of days to forecast
   * @returns {Promise<Object>} - Weight statistics
   */
  async getStats(options = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      
      if (options.period) queryParams.append('period', options.period);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.forecastDays) queryParams.append('forecastDays', options.forecastDays);
      
      const queryString = queryParams.toString();
      const url = queryString 
        ? `${this.statsEndpoint}?${queryString}` 
        : this.statsEndpoint;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getUserId()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Get the current user ID (simplified for this demo)
   * In a real app, this would be integrated with your auth system
   * @returns {string} - The user ID
   */
  getUserId() {
    // In a real app, get this from your auth system
    // For demo purposes, we'll use a default or stored ID
    return localStorage.getItem('userId') || 'default-user';
  }

  /**
   * Set the current user ID (simplified for this demo)
   * @param {string} userId - The user ID to set
   */
  setUserId(userId) {
    localStorage.setItem('userId', userId);
  }
}

// Export as singleton
const weightService = new WeightService();
export default weightService; 