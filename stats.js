// stats.js - Statistical calculations for weight tracking

/**
 * Calculate average weight change over a period of days
 * @param {Array} formattedEntries - Array of formatted entries with dateObj property
 * @param {number} days - Number of days to calculate average for
 * @returns {Object} - Object with average data
 */
function calculatePeriodAverage(formattedEntries, days) {
  if (!formattedEntries || formattedEntries.length < 2) {
    console.log(`${days}-day period: Not enough entries`, { total: formattedEntries?.length || 0 });
    return { value: 0, hasData: false };
  }
  
  // Use the date of the most recent entry
  const mostRecentDate = formattedEntries[0].dateObj;
  
  // Create a cutoff date by subtracting days
  const cutoffDate = new Date(mostRecentDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Filter entries within the period
  const recentEntries = formattedEntries.filter(entry => entry.dateObj >= cutoffDate);
  
  if (recentEntries.length < 2) {
    console.log(`${days}-day period: Not enough filtered entries`, { filtered: recentEntries.length });
    return { value: 0, hasData: false };
  }
  
  // Calculate the oldest and newest weights in the period
  const oldestEntry = recentEntries[recentEntries.length - 1];
  const newestEntry = recentEntries[0];
  
  // Calculate average daily change
  const daysDiff = Math.max(1, (newestEntry.dateObj - oldestEntry.dateObj) / (1000 * 60 * 60 * 24));
  const weightDiff = newestEntry.weight - oldestEntry.weight;
  const avgDailyChange = weightDiff / daysDiff;
  
  // Format dates for display
  const formatDate = (date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };
  
  return { 
    value: avgDailyChange.toFixed(2), 
    hasData: true,
    totalChange: weightDiff.toFixed(1),
    startWeight: oldestEntry.weight,
    endWeight: newestEntry.weight,
    startDate: formatDate(oldestEntry.dateObj),
    endDate: formatDate(newestEntry.dateObj)
  };
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
 * Get BMI category and corresponding color class
 * @param {number} bmi - BMI value
 * @returns {Object} - Object with category and color properties
 */
function getBMICategory(bmi) {
  if (!bmi) return { category: "", color: "" };
  
  if (bmi < 18.5) return { category: "Underweight", color: "text-yellow" };
  if (bmi < 25) return { category: "Healthy", color: "text-green" };
  if (bmi < 30) return { category: "Overweight", color: "text-yellow" };
  return { category: "Obese", color: "text-red" };
}

/**
 * Calculate forecast to reach goal weight based on current trend
 * @param {Object} latestEntry - Latest weight entry
 * @param {number} goalWeight - Goal weight
 * @param {Object} avgTrend - Average trend data (from calculatePeriodAverage)
 * @returns {Object} - Forecast data
 */
function calculateForecast(latestEntry, goalWeight, avgTrend) {
  if (!avgTrend.hasData || !goalWeight || !latestEntry) {
    return { isPossible: false, reason: "Insufficient data" };
  }
  
  const avgDailyChange = parseFloat(avgTrend.value);
  if (avgDailyChange === 0) {
    return { isPossible: false, reason: "No change in weight trend" };
  }
  
  const currentWeight = latestEntry.weight;
  const weightDifference = goalWeight - currentWeight;
  
  // If weight trend doesn't align with goal
  if ((weightDifference < 0 && avgDailyChange > 0) || 
      (weightDifference > 0 && avgDailyChange < 0)) {
    return { 
      isPossible: false, 
      reason: weightDifference < 0 
        ? "Currently gaining weight while goal is to lose" 
        : "Currently losing weight while goal is to gain"
    };
  }
  
  // Calculate days needed
  const daysNeeded = Math.abs(Math.round(weightDifference / avgDailyChange));
  
  // Calculate target date
  const today = new Date(latestEntry.date);
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysNeeded);
  
  // Format target date
  const targetDateFormatted = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return {
    isPossible: true,
    daysNeeded,
    targetDate,
    targetDateFormatted,
    weeklyRate: Math.abs(avgDailyChange * 7).toFixed(1)
  };
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