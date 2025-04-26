"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import * as Stats from "../../stats.js";

function SummaryCard({ colors, entries, startWeight, goalWeight, height, theme }) {
  // Skip rendering if no entries
  if (!entries || entries.length === 0) {
    return null;
  }

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Use BMI calculation from Stats module
  const calculateBMI = (weightKg, heightCm) => {
    return Stats.calculateBMI(weightKg, heightCm);
  };

  // Use BMI category function from Stats module
  const getBMICategory = (bmi) => {
    return Stats.getBMICategory(bmi, theme);
  };

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Summary</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${colors.blockBg} p-4 rounded-md`}>
            <div className="text-sm text-[#b5bac1] mb-1">Current</div>
            <div className={`text-xl font-bold ${colors.text}`}>{entries[0].weight} kg</div>
          </div>
          
          {goalWeight && (
            <div className={`${colors.blockBg} p-4 rounded-md`}>
              <div className="text-sm text-[#b5bac1] mb-1">Goal</div>
              <div className={`text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
            </div>
          )}
          
          {startWeight && entries.length > 0 && (
            <div className={`${colors.blockBg} p-4 rounded-md`}>
              <div className="text-sm text-[#b5bac1] mb-1">Total Change</div>
              <div className="flex items-center">
                <span className={`text-xl font-bold ${colors.text} mr-1`}>
                  {(entries[0].weight - startWeight).toFixed(1)} kg
                </span>
                {getTrendIcon(entries[0].weight - startWeight)}
              </div>
            </div>
          )}
          
          {entries.length > 1 && (
            <div className={`${colors.blockBg} p-4 rounded-md`}>
              <div className="text-sm text-[#b5bac1] mb-1">Last Change</div>
              <div className="flex items-center">
                <span className={`text-xl font-bold ${colors.text} mr-1`}>
                  {(entries[0].weight - entries[1].weight).toFixed(1)} kg
                </span>
                {getTrendIcon(entries[0].weight - entries[1].weight)}
              </div>
            </div>
          )}

          {/* BMI Card */}
          {height && entries.length > 0 && (
            <div className={`${colors.blockBg} p-4 rounded-md`}>
              <div className="text-sm text-[#b5bac1] mb-1">BMI</div>
              <div className={`text-xl font-bold ${colors.text}`}>{calculateBMI(entries[0].weight, height)}</div>
              <div className={`text-sm ${getBMICategory(calculateBMI(entries[0].weight, height)).color} mt-1`}>
                {getBMICategory(calculateBMI(entries[0].weight, height)).category}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SummaryCard; 