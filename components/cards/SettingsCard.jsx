"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Save } from "lucide-react";
import { toast } from "sonner";

function SettingsCard({ 
  colors, 
  startWeight, 
  goalWeight, 
  height,
  setStartWeight,
  setGoalWeight,
  setHeight
}) {
  // Handler functions
  const handleSetStart = () => {
    if (!startWeight || isNaN(parseFloat(startWeight))) {
      toast.error("Please enter a valid start weight");
      return;
    }
    
    toast.success("Start weight saved");
  };
  
  const handleSetGoal = () => {
    if (!goalWeight || isNaN(parseFloat(goalWeight))) {
      toast.error("Please enter a valid goal weight");
      return;
    }
    
    toast.success("Goal weight saved");
  };

  const handleSetHeight = () => {
    if (!height || isNaN(parseFloat(height))) {
      toast.error("Please enter a valid height");
      return;
    }
    
    toast.success("Height saved");
  };

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Settings</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Start Weight (kg)</label>
            <div className="flex space-x-2">
              <Input
                value={startWeight}
                onChange={e => setStartWeight(e.target.value)}
                type="number"
                step="0.1"
                placeholder="e.g. 80.5"
                className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
              />
              <button
                onClick={handleSetStart}
                className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
              >
                <Save className="h-4 w-4 mr-1 text-white" />
                <span className="text-white">Set</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Goal Weight (kg)</label>
            <div className="flex space-x-2">
              <Input
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                type="number"
                step="0.1"
                placeholder="e.g. 75.0"
                className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
              />
              <button
                onClick={handleSetGoal}
                className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
              >
                <Save className="h-4 w-4 mr-1 text-white" />
                <span className="text-white">Set</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Height (cm)</label>
            <div className="flex space-x-2">
              <Input
                value={height}
                onChange={e => setHeight(e.target.value)}
                type="number"
                step="0.1"
                placeholder="e.g. 175"
                className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
              />
              <button
                onClick={handleSetHeight}
                className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md flex items-center space-x-1`}
              >
                <Save className="h-4 w-4 mr-1 text-white" />
                <span className="text-white">Set</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SettingsCard; 