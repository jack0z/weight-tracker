"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { toast } from "sonner";
import * as Data from "../../data.js";

function AddEntryCard({ 
  colors, 
  date, 
  setDate, 
  weight, 
  setWeight, 
  entries, 
  setEntries,
  theme
}) {
  // Handler function
  const handleAdd = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      toast.error("Please enter a valid weight");
      return;
    }
    
    // Use our Data module to add an entry
    const updatedEntries = Data.addEntry(date, weight, entries);
    setEntries(updatedEntries);
    setWeight("");
    toast.success("Weight entry added");
  };

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Add New Entry</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Date</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`${colors.inputBg} h-10 pl-3 pr-8 rounded-md ${colors.text}`}
              style={{ 
                backgroundPosition: "calc(100% - 8px) center",
                backgroundSize: "20px"
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Weight (kg)</label>
            <div className="flex space-x-2">
              <Input
                value={weight}
                onChange={e => setWeight(e.target.value)}
                type="number"
                step="0.1"
                placeholder="Enter weight"
                className={`${colors.inputBg} h-10 pl-3 rounded-md ${colors.text}`}
              />
              <button 
                onClick={handleAdd} 
                className={`${colors.buttonBgPrimary} px-4 py-2 h-10 rounded-md border border-[#4752c4]`}
              >
                <span className="text-white">Add</span>
              </button>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-[#b5bac1]">
            <p>Need to import multiple entries? Use the <strong>Data Management</strong> section below.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AddEntryCard; 