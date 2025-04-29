// stats.js - Statistical calculations for weight tracking

import { format } from 'date-fns';

/**
 * Calculate average weight change over a period of days
 * @param {Array} entries - Array of weight entries
 * @param {number} days - Number of days to calculate average for
 * @returns {Object} - Object with average data
 */
export function calculatePeriodAverage(entries, days) {
  if (!entries || entries.length < 2) {
    return { hasData: false, value: 0, average: 0 };
  }

  // Ensure dates are properly parsed
  const entriesWithDates = entries.map(entry => ({
    ...entry,
    dateObj: new Date(entry.date)
  }));

  // Sort by date, newest first
  const sortedEntries = entriesWithDates.sort((a, b) => b.dateObj - a.dateObj);

  // Get start and end dates for the period
  const endDate = sortedEntries[0].dateObj;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  // Filter entries within the period
  const periodEntries = sortedEntries.filter(entry => 
    entry.dateObj >= startDate && entry.dateObj <= endDate
  );

  if (periodEntries.length < 2) {
    return { hasData: false, value: 0, average: 0 };
  }

  const totalChange = periodEntries[0].weight - periodEntries[periodEntries.length - 1].weight;
  const daysDiff = (periodEntries[0].dateObj - periodEntries[periodEntries.length - 1].dateObj) / (1000 * 60 * 60 * 24);
  const averageChange = daysDiff > 0 ? totalChange / daysDiff : 0;

  return {
    hasData: true,
    value: parseFloat(averageChange.toFixed(3)),
    average: periodEntries.reduce((sum, entry) => sum + parseFloat(entry.weight), 0) / periodEntries.length,
    totalChange: totalChange.toFixed(1),
    startDate: format(periodEntries[periodEntries.length - 1].dateObj, "MMM d"),
    endDate: format(periodEntries[0].dateObj, "MMM d"),
    startWeight: periodEntries[periodEntries.length - 1].weight,
    endWeight: periodEntries[0].weight
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
  calculateBMI,
  getBMICategory,
  calculateForecast,
  getWeightRanges,
  getWeightDistribution
};