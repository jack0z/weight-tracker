"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, TrendingDown, TrendingUp, Minus, ArrowRight } from "lucide-react";
import * as Stats from "../../stats.js";

function ForecastCard({ colors, formattedEntries, goalWeight, theme, entries }) {
  // Skip rendering if no entries or no goal weight
  if (!formattedEntries || formattedEntries.length === 0 || !goalWeight) {
    return null;
  }

  // Period calculations
  const sevenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 7);
  const fourteenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 14);
  const thirtyDayAvg = Stats.calculatePeriodAverage(formattedEntries, 30);

  // Calculate forecast using Stats module
  const calculateForecast = () => {
    if (!formattedEntries || formattedEntries.length === 0 || !goalWeight) {
      return null;
    }
    
    // Create userData object with weightGoal
    const userData = {
      weightGoal: goalWeight
    };
    
    return Stats.calculateForecast(formattedEntries, userData);
  };

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Safe number formatter
  const safeFormat = (value, decimals = 1) => {
    if (value === undefined || value === null) return "N/A";
    // Make sure value is a number before calling toFixed
    if (typeof value !== 'number') {
      console.warn("Non-number value passed to safeFormat:", value);
      return "N/A";
    }
    try {
      return value.toFixed(decimals);
    } catch (error) {
      console.error("Error formatting value:", error);
      return "N/A";
    }
  };

  const forecast = calculateForecast();

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Forecast</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Projection */}
          <div className={`${colors.blockBg} p-4 rounded-md`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`${colors.text} text-lg font-medium`}>Weight Projection</h3>
            </div>
            
            {forecast?.hasData && forecast?.willReachGoal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Current trend:</span>
                  <span className={`${colors.text} font-medium flex items-center gap-1`}>
                    {getTrendIcon(forecast.dailyChange)}
                    {forecast.dailyChange ? `${parseFloat(forecast.dailyChange) > 0 ? "+" : ""}${forecast.dailyChange} kg/day` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Weekly rate:</span>
                  <span className={`${colors.text} font-medium`}>
                    {forecast.dailyChange ? `${safeFormat(Math.abs(parseFloat(forecast.dailyChange) * 7), 1)} kg/week` : "N/A"}
                  </span>
                </div>
                <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-[#E5DFC5]'} my-3`}></div>
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Current:</span>
                  <span className={`${colors.text} font-medium`}>{forecast.currentWeight} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Goal:</span>
                  <span className={`${colors.text} font-medium`}>{forecast.goalWeight} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Remaining:</span>
                  <span className={`${colors.text} font-medium`}>{forecast.distanceToGoal} kg</span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1 text-sm">
                    <span className={`${theme === 'dark' ? 'text-[#8edb9e]' : 'text-[#8DA101]'} font-medium`}>
                      Progress to Goal
                    </span>
                    <span className={`${theme === 'dark' ? 'text-[#8edb9e]' : 'text-[#8DA101]'} font-medium`}>
                      {forecast.percentageComplete}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className={`h-2.5 rounded-full ${theme === 'dark' ? 'bg-[#126134]' : 'bg-[#8DA101]'}`} 
                      style={{ width: `${forecast.percentageComplete}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-[#ed4245]">
                {forecast?.hasData && forecast.wrongDirection 
                  ? `Currently ${forecast.trend} weight while trying to ${forecast.direction} weight`
                  : (forecast ? forecast.reason : "Insufficient data for projection")}
              </div>
            )}
          </div>
          
          {/* Target Date */}
          <div className={`${colors.blockBg} p-4 rounded-md`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`${colors.text} text-lg font-medium`}>Target Date Estimation</h3>
              <Calendar size={20} className={`${colors.textMuted}`} />
            </div>
            
            {forecast?.hasData && forecast?.willReachGoal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Estimated time to goal:</span>
                  <span className={`${colors.text} font-medium`}>{forecast.daysToGoal} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${colors.textMuted}`}>Target date:</span>
                  <span className={`${colors.text} font-medium`}>{forecast.projectedDate}</span>
                </div>
                
                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#E5DFC5]'}`}>
                  <div className="flex items-center space-x-2 text-sm text-[#b5bac1]">
                    <span>Today</span>
                    <div className={`flex-1 h-[3px] ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'} rounded-full relative`}>
                      <div 
                        className={`absolute -top-1 left-0 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'}`}
                        style={{ left: "0%" }}
                      ></div>
                      <div 
                        className={`absolute -top-1 right-0 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#57f287]' : 'bg-[#8DA101]'}`}
                        style={{ right: "0%" }}
                      ></div>
                    </div>
                    <span>{forecast.projectedDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center flex flex-col items-center space-y-4">
                <ArrowRight size={32} className={`${colors.textMuted}`} />
                <span className={`${colors.textMuted}`}>
                  {forecast ? forecast.reason : "Set a goal weight and establish a trend"}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ForecastCard; 