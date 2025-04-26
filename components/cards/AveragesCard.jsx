"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, TrendingDown, TrendingUp, Minus } from "lucide-react";
import * as Stats from "../../stats.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

function AveragesCard({ colors, formattedEntries, theme }) {
  // Skip rendering if no entries
  if (!formattedEntries || formattedEntries.length === 0) {
    return null;
  }

  // Get period averages
  const sevenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 7);
  const fourteenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 14);
  const thirtyDayAvg = Stats.calculatePeriodAverage(formattedEntries, 30);

  // Get trend icon
  const getTrendIcon = (value) => {
    if (value === undefined || value === null || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Helper for value color class
  const getValueColorClass = (value) => {
    if (value === undefined || value === null || value === 0) return colors.text;
    return value < 0 ? 
      (theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]') : 
      colors.negative;
  };

  // Safe formatter
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

  // Check if any period has data
  const hasAnyData = (sevenDayAvg && sevenDayAvg.hasData) || 
                    (fourteenDayAvg && fourteenDayAvg.hasData) || 
                    (thirtyDayAvg && thirtyDayAvg.hasData);

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Weight Averages</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Starting</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Daily Avg</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 7-day row */}
              {sevenDayAvg && sevenDayAvg.hasData && (
                <TableRow>
                  <TableCell className={`${colors.text} font-medium`}>7 Days</TableCell>
                  <TableCell>{sevenDayAvg.startDate} - {sevenDayAvg.endDate}</TableCell>
                  <TableCell>{sevenDayAvg.startWeight} kg</TableCell>
                  <TableCell>{sevenDayAvg.endWeight} kg</TableCell>
                  <TableCell 
                    className={`${parseFloat(sevenDayAvg.totalChange) < 0 ? colors.positive : parseFloat(sevenDayAvg.totalChange) > 0 ? colors.negative : ""}`}
                  >
                    {sevenDayAvg.totalChange > 0 ? "+" : ""}{sevenDayAvg.totalChange} kg
                  </TableCell>
                  <TableCell>
                    {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                  </TableCell>
                  <TableCell className="flex items-center">
                    {getTrendIcon(parseFloat(sevenDayAvg.value))}
                  </TableCell>
                </TableRow>
              )}
              
              {/* 14-day row */}
              {fourteenDayAvg && fourteenDayAvg.hasData && (
                <TableRow>
                  <TableCell className={`${colors.text} font-medium`}>14 Days</TableCell>
                  <TableCell>{fourteenDayAvg.startDate} - {fourteenDayAvg.endDate}</TableCell>
                  <TableCell>{fourteenDayAvg.startWeight} kg</TableCell>
                  <TableCell>{fourteenDayAvg.endWeight} kg</TableCell>
                  <TableCell 
                    className={`${parseFloat(fourteenDayAvg.totalChange) < 0 ? colors.positive : parseFloat(fourteenDayAvg.totalChange) > 0 ? colors.negative : ""}`}
                  >
                    {fourteenDayAvg.totalChange > 0 ? "+" : ""}{fourteenDayAvg.totalChange} kg
                  </TableCell>
                  <TableCell>
                    {fourteenDayAvg.value > 0 ? "+" : ""}{fourteenDayAvg.value} kg/day
                  </TableCell>
                  <TableCell className="flex items-center">
                    {getTrendIcon(parseFloat(fourteenDayAvg.value))}
                  </TableCell>
                </TableRow>
              )}
              
              {/* 30-day row */}
              {thirtyDayAvg && thirtyDayAvg.hasData && (
                <TableRow>
                  <TableCell className={`${colors.text} font-medium`}>30 Days</TableCell>
                  <TableCell>{thirtyDayAvg.startDate} - {thirtyDayAvg.endDate}</TableCell>
                  <TableCell>{thirtyDayAvg.startWeight} kg</TableCell>
                  <TableCell>{thirtyDayAvg.endWeight} kg</TableCell>
                  <TableCell 
                    className={`${parseFloat(thirtyDayAvg.totalChange) < 0 ? colors.positive : parseFloat(thirtyDayAvg.totalChange) > 0 ? colors.negative : ""}`}
                  >
                    {thirtyDayAvg.totalChange > 0 ? "+" : ""}{thirtyDayAvg.totalChange} kg
                  </TableCell>
                  <TableCell>
                    {thirtyDayAvg.value > 0 ? "+" : ""}{thirtyDayAvg.value} kg/day
                  </TableCell>
                  <TableCell className="flex items-center">
                    {getTrendIcon(parseFloat(thirtyDayAvg.value))}
                  </TableCell>
                </TableRow>
              )}
              
              {/* No data row */}
              {!hasAnyData && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-[#b5bac1]">
                    Need more data points for averages. Add entries over time to see trends.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default AveragesCard; 