const { connectToDatabase } = require('../database/connection');
const mongoose = require('mongoose');
require('../database/models/WeightEntry');

const WeightEntry = mongoose.model('WeightEntry');

// Helper to validate date format (YYYY-MM-DD)
function isValidDateFormat(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

// Helper to parse date string safely
function parseDate(dateString) {
  if (!isValidDateFormat(dateString)) {
    return null;
  }
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Calculate average weight for a given date range
async function calculateAverageWeight(userId, startDate, endDate) {
  const entries = await WeightEntry.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  if (!entries || entries.length === 0) {
    return {
      hasData: false,
      avgWeight: null,
      weightChange: null,
      dailyChange: null,
      count: 0
    };
  }
  
  // Calculate average weight
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const avgWeight = totalWeight / entries.length;
  
  // Calculate total weight change
  const weightChange = entries.length > 1 
    ? entries[entries.length - 1].weight - entries[0].weight 
    : 0;
  
  // Calculate average daily change
  const daysDiff = entries.length > 1 
    ? (entries[entries.length - 1].date - entries[0].date) / (1000 * 60 * 60 * 24)
    : 1;
  
  const dailyChange = daysDiff > 0 ? weightChange / daysDiff : 0;
  
  return {
    hasData: true,
    avgWeight,
    weightChange,
    dailyChange,
    count: entries.length
  };
}

// Calculate weight distribution
async function calculateWeightDistribution(userId, startDate, endDate) {
  const entries = await WeightEntry.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  if (!entries || entries.length === 0) {
    return {
      ranges: [],
      min: null,
      max: null
    };
  }
  
  // Find min and max weights
  let min = Infinity;
  let max = -Infinity;
  
  entries.forEach(entry => {
    if (entry.weight < min) min = entry.weight;
    if (entry.weight > max) max = entry.weight;
  });
  
  // If only one entry, adjust range slightly for visualization
  if (min === max) {
    min = min - 0.5;
    max = max + 0.5;
  }
  
  // Create weight ranges
  const rangeSize = (max - min) / 10;
  const ranges = [];
  
  for (let i = 0; i < 10; i++) {
    const start = min + (i * rangeSize);
    const end = min + ((i + 1) * rangeSize);
    
    // Count entries in this range
    const count = entries.filter(entry => 
      entry.weight >= start && (i === 9 ? entry.weight <= end : entry.weight < end)
    ).length;
    
    ranges.push({
      start,
      end,
      count
    });
  }
  
  return {
    ranges,
    min,
    max
  };
}

// Calculate weight forecast
async function calculateWeightForecast(userId, days = 30) {
  // Get the last 30 days of entries to establish trend
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const entries = await WeightEntry.find({
    userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: 1 });
  
  if (!entries || entries.length < 5) {
    return {
      hasData: false,
      message: 'Not enough data for forecast',
      forecastDate: null,
      forecastWeight: null,
      trend: null
    };
  }
  
  // Use linear regression to calculate trend
  const points = entries.map(entry => ({
    x: entry.date.getTime(),
    y: entry.weight
  }));
  
  // Calculate average x and y
  const n = points.length;
  const avgX = points.reduce((sum, point) => sum + point.x, 0) / n;
  const avgY = points.reduce((sum, point) => sum + point.y, 0) / n;
  
  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;
  
  for (const point of points) {
    numerator += (point.x - avgX) * (point.y - avgY);
    denominator += Math.pow(point.x - avgX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = avgY - (slope * avgX);
  
  // Calculate forecast date and weight
  const forecastDate = new Date(today);
  forecastDate.setDate(forecastDate.getDate() + days);
  
  const forecastWeight = slope * forecastDate.getTime() + intercept;
  
  // Determine trend
  let trend;
  if (Math.abs(slope) < 0.00000001) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'gaining';
  } else {
    trend = 'losing';
  }
  
  return {
    hasData: true,
    forecastDate,
    forecastWeight,
    dailyChange: slope * (24 * 60 * 60 * 1000), // Convert to daily change
    trend
  };
}

exports.handler = async (event, context) => {
  // Make database connection available to the function
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight) request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }

    // Verify user authentication - in a real app this would validate JWT or similar auth token
    // For simplicity, we'll use a hardcoded userId for now
    const userId = event.headers.authorization || 'default-user';
    
    // Parse query parameters
    const { period, startDate, endDate, forecastDays } = event.queryStringParameters || {};

    // Initialize today and date ranges
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let queryStartDate, queryEndDate;
    
    // If custom date range is provided
    if (startDate && endDate) {
      queryStartDate = parseDate(startDate);
      queryEndDate = parseDate(endDate);
      
      if (!queryStartDate || !queryEndDate) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid date format. Use YYYY-MM-DD.' })
        };
      }
      
      // Set time to beginning/end of day
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate.setHours(23, 59, 59, 999);
      
    } else {
      // Default to last 30 days if no specific period is provided
      const defaultPeriod = period || '30d';
      queryEndDate = new Date(today);
      
      switch (defaultPeriod) {
        case '7d':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 7);
          break;
          
        case '14d':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 14);
          break;
          
        case '30d':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 30);
          break;
          
        case '90d':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 90);
          break;
          
        case '1y':
          queryStartDate = new Date(today);
          queryStartDate.setFullYear(today.getFullYear() - 1);
          break;
          
        case 'all':
          // Find earliest entry to determine start date
          const earliestEntry = await WeightEntry.findOne({ userId })
            .sort({ date: 1 })
            .limit(1);
            
          if (earliestEntry) {
            queryStartDate = new Date(earliestEntry.date);
          } else {
            queryStartDate = new Date(today);
            queryStartDate.setDate(today.getDate() - 30);
          }
          break;
          
        default:
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 30);
      }
      
      queryStartDate.setHours(0, 0, 0, 0);
    }
    
    // Prepare response object
    const response = {
      timeframe: {
        startDate: queryStartDate,
        endDate: queryEndDate
      }
    };
    
    // Calculate various statistics in parallel
    const [sevenDayStats, fourteenDayStats, thirtyDayStats, periodStats, distribution, forecast] = await Promise.all([
      // Calculate 7-day average
      calculateAverageWeight(
        userId, 
        new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)), 
        today
      ),
      
      // Calculate 14-day average
      calculateAverageWeight(
        userId, 
        new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000)), 
        today
      ),
      
      // Calculate 30-day average
      calculateAverageWeight(
        userId, 
        new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)), 
        today
      ),
      
      // Calculate stats for the selected period
      calculateAverageWeight(userId, queryStartDate, queryEndDate),
      
      // Calculate weight distribution
      calculateWeightDistribution(userId, queryStartDate, queryEndDate),
      
      // Calculate weight forecast
      calculateWeightForecast(userId, forecastDays ? parseInt(forecastDays, 10) : 30)
    ]);
    
    // Add stats to response
    response.averages = {
      sevenDay: sevenDayStats,
      fourteenDay: fourteenDayStats,
      thirtyDay: thirtyDayStats,
      period: periodStats
    };
    
    response.distribution = distribution;
    response.forecast = forecast;
    
    // Return stats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
}; 