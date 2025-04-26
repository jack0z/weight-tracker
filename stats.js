// stats.js - Statistical calculations for weight tracking

/**
 * Calculate average weight change over a period of days
 * @param {Array} formattedEntries - Array of formatted entries with dateObj property
 * @param {number} days - Number of days to calculate average for
 * @returns {Object} - Object with average data
 */
function calculatePeriodAverage(formattedEntries, days) {
  try {
    // Check for valid entries array
    if (!formattedEntries || !Array.isArray(formattedEntries)) {
      console.log(`${days}-day period: Invalid entries data (not an array)`);
      return { value: 0, hasData: false, reason: "Invalid data format" };
    }
    
    // Need at least 2 entries to calculate a trend
    if (formattedEntries.length < 2) {
      console.log(`${days}-day period: Not enough entries`, { total: formattedEntries.length || 0 });
      return { 
        value: 0, 
        hasData: false, 
        reason: `Need at least 2 entries (found ${formattedEntries.length})` 
      };
    }
    
    // Ensure entries have date objects and valid weights
    const validEntries = formattedEntries.filter(entry => 
      entry && 
      entry.dateObj && 
      entry.dateObj instanceof Date && 
      !isNaN(entry.dateObj) &&
      entry.weight && 
      !isNaN(parseFloat(entry.weight))
    );
    
    if (validEntries.length < 2) {
      console.log(`${days}-day period: Not enough valid entries with dates and weights`, { 
        total: formattedEntries.length,
        valid: validEntries.length 
      });
      
      // Fall back to all entries if we need to
      const oldestEntry = formattedEntries[formattedEntries.length - 1];
      const newestEntry = formattedEntries[0];
      
      if (oldestEntry && newestEntry && 
          oldestEntry.weight && !isNaN(parseFloat(oldestEntry.weight)) &&
          newestEntry.weight && !isNaN(parseFloat(newestEntry.weight))) {
        // Calculate average daily change without proper dates
        const daysDiff = 1; // Default to 1 day
        const oldestWeight = parseFloat(oldestEntry.weight);
        const newestWeight = parseFloat(newestEntry.weight);
        const weightDiff = newestWeight - oldestWeight;
        const avgDailyChange = weightDiff / daysDiff;
        
        return { 
          value: avgDailyChange.toFixed(2), 
          hasData: true,
          totalChange: weightDiff.toFixed(1),
          startWeight: oldestWeight.toFixed(1),
          endWeight: newestWeight.toFixed(1),
          note: "Using simplified calculation (invalid dates)"
        };
      }
      
      return { value: 0, hasData: false, reason: "Invalid date objects or weights in entries" };
    }
    
    // Use the date of the most recent entry
    const mostRecentDate = validEntries[0].dateObj;
    
    // Create a cutoff date by subtracting days
    const cutoffDate = new Date(mostRecentDate);
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Filter entries within the period
    const recentEntries = validEntries.filter(entry => entry.dateObj >= cutoffDate);
    
    // Format dates for display
    const formatDate = (date) => {
      if (!(date instanceof Date) || isNaN(date)) return "Unknown";
      try {
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      } catch (e) {
        return "Invalid date";
      }
    };
    
    // If we don't have enough entries in the period, use all valid entries with a note
    if (recentEntries.length < 2) {
      console.log(`${days}-day period: Using all available entries instead of period filter`, { 
        filtered: recentEntries.length,
        valid: validEntries.length,
        total: formattedEntries.length
      });
      
      // Use the oldest and newest entries
      const oldestEntry = validEntries[validEntries.length - 1];
      const newestEntry = validEntries[0];
      
      // Calculate average daily change with proper type checking
      const daysDiff = Math.max(1, (newestEntry.dateObj - oldestEntry.dateObj) / (1000 * 60 * 60 * 24));
      const oldestWeight = parseFloat(oldestEntry.weight);
      const newestWeight = parseFloat(newestEntry.weight);
      
      if (isNaN(oldestWeight) || isNaN(newestWeight)) {
        return { value: 0, hasData: false, reason: "Invalid weight values" };
      }
      
      const weightDiff = newestWeight - oldestWeight;
      const avgDailyChange = weightDiff / daysDiff;
      
      return { 
        value: avgDailyChange.toFixed(2), 
        hasData: true,
        totalChange: weightDiff.toFixed(1),
        startWeight: oldestWeight.toFixed(1),
        endWeight: newestWeight.toFixed(1),
        startDate: formatDate(oldestEntry.dateObj),
        endDate: formatDate(newestEntry.dateObj),
        note: `Using all entries (${days}-day period had insufficient data)`
      };
    }
    
    // Calculate the oldest and newest weights in the period
    const oldestEntry = recentEntries[recentEntries.length - 1];
    const newestEntry = recentEntries[0];
    
    // Calculate average daily change with proper parsing
    const daysDiff = Math.max(1, (newestEntry.dateObj - oldestEntry.dateObj) / (1000 * 60 * 60 * 24));
    const oldestWeight = parseFloat(oldestEntry.weight);
    const newestWeight = parseFloat(newestEntry.weight);
    
    if (isNaN(oldestWeight) || isNaN(newestWeight)) {
      return { value: 0, hasData: false, reason: "Invalid weight values" };
    }
    
    const weightDiff = newestWeight - oldestWeight;
    const avgDailyChange = weightDiff / daysDiff;
    
    return { 
      value: avgDailyChange.toFixed(2), 
      hasData: true,
      totalChange: weightDiff.toFixed(1),
      startWeight: oldestWeight.toFixed(1),
      endWeight: newestWeight.toFixed(1),
      startDate: formatDate(oldestEntry.dateObj),
      endDate: formatDate(newestEntry.dateObj)
    };
  } catch (error) {
    console.error(`Error in calculatePeriodAverage (${days}-day period):`, error);
    return { 
      value: 0, 
      hasData: false, 
      error: error.message, 
      reason: "Exception occurred during calculation" 
    };
  }
}

/**
 * Calculate BMI from weight and height
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @returns {string|null} - BMI value as string with 1 decimal place, or null if inputs are invalid
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

/**
 * Get BMI category and associated color
 * @param {number} bmi - BMI value
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {Object} - Category and color information
 */
function getBMICategory(bmi, theme = 'dark') {
  if (!bmi) return { category: "", color: "" };
  
  if (bmi < 18.5) return { 
    category: "Underweight", 
    color: theme === 'dark' ? "text-[#fee75c]" : "text-[#DFA000]" 
  };
  
  if (bmi < 25) return { 
    category: "Healthy", 
    color: theme === 'dark' ? "text-[#57f287]" : "text-[#126134]" 
  };
  
  if (bmi < 30) return { 
    category: "Overweight", 
    color: theme === 'dark' ? "text-[#fee75c]" : "text-[#F85552]" 
  };
  
  return { 
    category: "Obese", 
    color: theme === 'dark' ? "text-[#ed4245]" : "text-[#F85552]" 
  };
}

/**
 * Calculate forecast data to reach goal weight
 * @param {Array} entries - Array of weight entries 
 * @param {Object} userData - User data containing weight goal
 * @returns {Object} - Object with forecast data
 */
function calculateForecast(entries, userData) {
  try {
    // Input validation
    if (!entries || !Array.isArray(entries) || entries.length < 2) {
      return {
        hasData: false,
        reason: "Need at least 2 entries to calculate forecast"
      };
    }

    if (!userData || !userData.weightGoal) {
      return {
        hasData: false,
        reason: "No weight goal defined"
      };
    }

    // Parse goal weight as number
    const goalWeight = parseFloat(userData.weightGoal);
    if (isNaN(goalWeight) || goalWeight <= 0) {
      return {
        hasData: false,
        reason: "Invalid weight goal"
      };
    }

    // Get current weight from most recent entry
    const currentEntry = entries[0];
    if (!currentEntry || !currentEntry.weight) {
      return {
        hasData: false,
        reason: "No current weight data available"
      };
    }

    const currentWeight = parseFloat(currentEntry.weight);
    if (isNaN(currentWeight)) {
      return {
        hasData: false,
        reason: "Current weight is not a valid number"
      };
    }

    // Get 30-day average from stats utility
    const thirtyDayAvg = calculatePeriodAverage(entries, 30);
    
    // Check if we have valid average data
    if (!thirtyDayAvg || !thirtyDayAvg.hasData) {
      return {
        hasData: false,
        reason: "Insufficient data for 30-day trend"
      };
    }

    // Parse daily change rate as number
    const dailyChange = parseFloat(thirtyDayAvg.value);
    if (isNaN(dailyChange) || dailyChange === 0) {
      return {
        hasData: false,
        reason: "Invalid or zero daily weight change rate"
      };
    }

    // Calculate if we're gaining or losing weight
    const isGaining = dailyChange > 0;
    const isLosing = dailyChange < 0;

    // Check direction compared to goal
    const distanceToGoal = currentWeight - goalWeight;
    const needToLose = distanceToGoal > 0;
    const needToGain = distanceToGoal < 0;

    // If trend direction doesn't match what's needed to reach goal
    if ((needToLose && isGaining) || (needToGain && isLosing)) {
      return {
        hasData: true,
        currentWeight: currentWeight.toFixed(1),
        goalWeight: goalWeight.toFixed(1),
        distanceToGoal: Math.abs(distanceToGoal).toFixed(1),
        dailyChange: dailyChange.toFixed(3),
        trend: isGaining ? "gaining" : "losing",
        projectedDate: null,
        daysToGoal: null,
        willReachGoal: false,
        wrongDirection: true,
        direction: needToLose ? "lose" : "gain"
      };
    }

    // Calculate days until goal
    const daysToGoal = Math.abs(Math.round(distanceToGoal / dailyChange));
    
    // Check if daysToGoal is a valid number
    if (isNaN(daysToGoal) || !isFinite(daysToGoal)) {
      return {
        hasData: true,
        currentWeight: currentWeight.toFixed(1),
        goalWeight: goalWeight.toFixed(1),
        distanceToGoal: Math.abs(distanceToGoal).toFixed(1),
        dailyChange: dailyChange.toFixed(3),
        trend: isGaining ? "gaining" : "losing",
        projectedDate: null,
        daysToGoal: null,
        willReachGoal: false,
        reason: "Calculation error: invalid days to goal"
      };
    }
    
    // Calculate goal date
    const today = new Date();
    const projectedDate = new Date(today);
    projectedDate.setDate(today.getDate() + daysToGoal);
    
    // Format projected date
    const formatDate = (date) => {
      if (!(date instanceof Date) || isNaN(date)) return "Unknown";
      try {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } catch (e) {
        return "Invalid date";
      }
    };

    // Calculate percentage progress to goal
    const getPercentageToGoal = () => {
      try {
        if (distanceToGoal === 0) return 100;
        
        // Track progress from starting weight to goal
        const startingEntry = entries[entries.length - 1];
        if (!startingEntry || !startingEntry.weight) return 0;
        
        const startingWeight = parseFloat(startingEntry.weight);
        if (isNaN(startingWeight)) return 0;
        
        const totalDistance = Math.abs(startingWeight - goalWeight);
        const currentDistance = Math.abs(currentWeight - goalWeight);
        
        if (totalDistance === 0) return 100; // Already at goal
        
        const percentComplete = ((totalDistance - currentDistance) / totalDistance) * 100;
        
        // Ensure percentage is between 0-100
        return Math.min(100, Math.max(0, percentComplete));
      } catch (e) {
        console.error("Error calculating percentage:", e);
        return 0;
      }
    };

    // Return forecast data
    return {
      hasData: true,
      currentWeight: currentWeight.toFixed(1),
      goalWeight: goalWeight.toFixed(1),
      distanceToGoal: Math.abs(distanceToGoal).toFixed(1),
      dailyChange: dailyChange.toFixed(3),
      daysToGoal: daysToGoal,
      projectedDate: formatDate(projectedDate),
      willReachGoal: true,
      percentageComplete: getPercentageToGoal().toFixed(1),
      trend: isGaining ? "gaining" : "losing",
      direction: needToLose ? "lose" : "gain"
    };
  } catch (error) {
    console.error("Error in forecast calculation:", error);
    return {
      hasData: false,
      error: error.message,
      reason: "Exception occurred during forecast calculation"
    };
  }
}

/**
 * Create weight range bins for distribution chart
 * @param {Array} entries - Array of weight entries
 * @returns {Array} - Array of weight range labels
 */
function getWeightRanges(entries) {
  if (!entries || entries.length === 0) return [];
  
  // Get min and max weights
  const weights = entries.map(entry => entry.weight);
  const minWeight = Math.floor(Math.min(...weights));
  const maxWeight = Math.ceil(Math.max(...weights));
  
  // Create ranges (0.5kg increments)
  const ranges = [];
  for (let i = minWeight; i <= maxWeight; i += 0.5) {
    ranges.push(`${i.toFixed(1)}-${(i + 0.5).toFixed(1)}`);
  }
  
  return ranges;
}

/**
 * Calculate distribution of weights
 * @param {Array} entries - Array of weight entries
 * @returns {Array} - Array of counts per weight range
 */
function getWeightDistribution(entries) {
  if (!entries || entries.length === 0) return [];
  
  const ranges = getWeightRanges(entries);
  const distribution = new Array(ranges.length).fill(0);
  
  const weights = entries.map(entry => entry.weight);
  const minWeight = Math.floor(Math.min(...weights));
  
  // Count days in each weight range
  entries.forEach(entry => {
    const weight = entry.weight;
    const rangeIndex = Math.floor((weight - minWeight) * 2);
    if (rangeIndex >= 0 && rangeIndex < distribution.length) {
      distribution[rangeIndex]++;
    }
  });
  
  return distribution;
}

// Export functions
export {
  calculatePeriodAverage,
  calculateBMI,
  getBMICategory,
  calculateForecast,
  getWeightRanges,
  getWeightDistribution
}; 