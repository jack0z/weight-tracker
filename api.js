/**
 * API Utility Module
 * Handles API communication with the backend
 */

// Base API URL - defaulting to relative path for same-domain deployment
const API_BASE = process.env.REACT_APP_API_BASE || '';

/**
 * Make a GET request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Object>} - API response
 */
export async function get(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint, window.location.origin);
  
  // Add query params if they exist
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });
  
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return await response.json();
}

/**
 * Make a POST request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} - API response
 */
export async function post(endpoint, data = {}) {
  const url = API_BASE + endpoint;
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return await response.json();
}

/**
 * Make a PUT request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} - API response
 */
export async function put(endpoint, data = {}) {
  const url = API_BASE + endpoint;
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return await response.json();
}

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} data - Optional request body data
 * @returns {Promise<Object>} - API response
 */
export async function del(endpoint, data = {}) {
  const url = API_BASE + endpoint;
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(Object.keys(data).length > 0 && { body: JSON.stringify(data) })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return await response.json();
}

// Weight entries specific API functions

/**
 * Get all weight entries for the current user
 * @param {Date} startDate - Optional start date for filtering entries
 * @param {Date} endDate - Optional end date for filtering entries
 * @returns {Promise<Array>} - Array of weight entries
 */
export async function getWeightEntries(startDate, endDate) {
  const params = {};
  
  if (startDate) {
    params.startDate = startDate.toISOString().split('T')[0];
  }
  
  if (endDate) {
    params.endDate = endDate.toISOString().split('T')[0];
  }
  
  return get('/api/weights', params);
}

/**
 * Add a new weight entry
 * @param {Object} entry - The weight entry object
 * @param {Date} entry.date - Date of the weight measurement
 * @param {number} entry.weight - Weight value
 * @param {string} entry.note - Optional note
 * @returns {Promise<Object>} - The created weight entry
 */
export async function addWeightEntry(entry) {
  return post('/api/weights', {
    date: entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : entry.date,
    weight: Number(entry.weight),
    note: entry.note || ''
  });
}

/**
 * Update an existing weight entry
 * @param {string} id - ID of the entry to update
 * @param {Object} entry - The updated weight entry data
 * @returns {Promise<Object>} - The updated weight entry
 */
export async function updateWeightEntry(id, entry) {
  const updateData = {};
  
  if (entry.weight !== undefined) {
    updateData.weight = Number(entry.weight);
  }
  
  if (entry.date !== undefined) {
    updateData.date = entry.date instanceof Date 
      ? entry.date.toISOString().split('T')[0] 
      : entry.date;
  }
  
  if (entry.note !== undefined) {
    updateData.note = entry.note;
  }
  
  return put(`/api/weights/${id}`, updateData);
}

/**
 * Delete a weight entry
 * @param {string} id - ID of the entry to delete
 * @returns {Promise<Object>} - Response from the server
 */
export async function deleteWeightEntry(id) {
  return del(`/api/weights/${id}`);
}

/**
 * Delete all weight entries for the current user
 * @returns {Promise<Object>} - Response from the server
 */
export async function deleteAllWeightEntries() {
  return del('/api/weights');
} 