/**
 * MongoDB API Service
 * For interacting with the MongoDB database through Netlify functions
 */

// Base API URL for Netlify functions
const API_BASE = '/.netlify/functions';

/**
 * API service for weight entry operations
 */
const mongoApi = {
  /**
   * Fetch all weight entries for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} - Array of weight entries
   */
  async getEntries(userId) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await fetch(`${API_BASE}/database/weight-entries?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch entries');
      }

      const entries = await response.json();
      
      // Convert date strings to Date objects and ensure weight is a number
      return entries.map(entry => ({
        ...entry,
        date: new Date(entry.date),
        weight: parseFloat(entry.weight)
      }));
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  },

  /**
   * Add a new weight entry
   * @param {Object} entry - The entry to add { userId, date, weight, notes }
   * @returns {Promise<Object>} - The saved entry
   */
  async addEntry(entry) {
    try {
      // Validate required fields
      if (!entry.userId || !entry.date || !entry.weight) {
        throw new Error('User ID, date, and weight are required');
      }

      const response = await fetch(`${API_BASE}/database/weight-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  },

  /**
   * Update an existing weight entry
   * @param {Object} entry - The entry to update { id, userId, date, weight, notes }
   * @returns {Promise<Object>} - The updated entry
   */
  async updateEntry(entry) {
    try {
      // Validate required fields
      if (!entry.id || !entry.userId) {
        throw new Error('Entry ID and User ID are required');
      }

      const response = await fetch(`${API_BASE}/database/weight-entries`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  },

  /**
   * Delete a weight entry
   * @param {Object} params - Delete parameters { id, userId }
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteEntry({ id, userId }) {
    try {
      // Validate required fields
      if (!id || !userId) {
        throw new Error('Entry ID and User ID are required');
      }

      const response = await fetch(`${API_BASE}/database/weight-entries`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  },

  /**
   * Clear all entries for a user
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} - Deletion result
   */
  async clearAllEntries(userId) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await fetch(`${API_BASE}/database/weight-entries?userId=${encodeURIComponent(userId)}&clearAll=true`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear entries');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing entries:', error);
      throw error;
    }
  },

  /**
   * Import multiple weight entries
   * @param {string} userId - User identifier
   * @param {Array} entries - Array of entries to import { date, weight, notes }
   * @returns {Promise<Object>} - Import results
   */
  async importEntries(userId, entries) {
    try {
      // Validate userId and entries
      if (!userId || !Array.isArray(entries) || entries.length === 0) {
        throw new Error('User ID and at least one entry are required');
      }

      // Process entries one by one
      const results = {
        success: true,
        added: 0,
        failed: 0,
        errors: []
      };

      for (const entry of entries) {
        try {
          await this.addEntry({
            userId,
            date: entry.date,
            weight: entry.weight,
            notes: entry.notes || ''
          });
          results.added++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            entry,
            error: error.message
          });
        }
      }

      // If no entries were added, mark the operation as failed
      if (results.added === 0) {
        results.success = false;
      }

      return results;
    } catch (error) {
      console.error('Error importing entries:', error);
      throw error;
    }
  }
};

export default mongoApi; 