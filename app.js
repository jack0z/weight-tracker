"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { format, parseISO, subDays, addDays } from "date-fns";
import { Trash2, Save, TrendingDown, TrendingUp, Minus, Download, Calendar, ArrowRight } from "lucide-react";
import { toast, Toaster } from "sonner";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function WeightTracker() {
  const [isClient, setIsClient] = useState(false);
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState([]);
  const [startWeight, setStartWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [date, setDate] = useState("");
  const [height, setHeight] = useState("");
  
  // Initialize state from localStorage only after component mounts
  useEffect(() => {
    setIsClient(true);
    const savedEntries = localStorage.getItem("weight-entries");
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    const savedStartWeight = localStorage.getItem("start-weight");
    if (savedStartWeight) {
      setStartWeight(parseFloat(savedStartWeight) || "");
    }
    
    const savedGoalWeight = localStorage.getItem("goal-weight");
    if (savedGoalWeight) {
      setGoalWeight(parseFloat(savedGoalWeight) || "");
    }
    
    const savedHeight = localStorage.getItem("height");
    if (savedHeight) {
      setHeight(parseFloat(savedHeight) || "");
    }
    
    setDate(format(new Date(), "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    if (isClient && entries.length > 0) {
      localStorage.setItem("weight-entries", JSON.stringify(entries));
    }
  }, [entries, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("start-weight", startWeight);
      localStorage.setItem("goal-weight", goalWeight);
      localStorage.setItem("height", height);
    }
  }, [startWeight, goalWeight, height, isClient]);

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

  const handleAdd = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      toast.error("Please enter a valid weight");
      return;
    }
    
    const newEntry = {
      id: Date.now(),
      date: new Date(date).toISOString(),
      weight: parseFloat(weight)
    };
    setEntries([newEntry, ...entries]);
    setWeight("");
    toast.success("Weight entry added");
  };
  
  const handleDelete = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
    toast.success("Entry deleted");
  };

  const formattedEntries = entries.map(e => ({
    ...e,
    dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
    dayFormatted: format(new Date(e.date), "EEEE"),
    dateObj: new Date(e.date)
  })).sort((a, b) => b.dateObj - a.dateObj);

  // Calculate the trend indicators
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className="h-4 w-4 text-[#b5bac1]" />;
    return value < 0 ? 
      <TrendingDown className="h-4 w-4 text-[#57f287]" /> : 
      <TrendingUp className="h-4 w-4 text-[#ed4245]" />;
  };

  // Simplified average calculation with consistent date handling
  const calculatePeriodAverage = (days) => {
    if (formattedEntries.length < 2) {
      console.log(`${days}-day period: Not enough entries`, { total: formattedEntries.length });
      return { value: 0, hasData: false };
    }
    
    // Use the date of the most recent entry instead of current date
    const mostRecentDate = formattedEntries[0].dateObj;
    const cutoffDate = subDays(mostRecentDate, days);
    
    console.log(`${days}-day period calculation:`, { 
      recentEntryDate: mostRecentDate.toISOString(), 
      cutoffDate: cutoffDate.toISOString(),
      totalEntries: formattedEntries.length,
      firstEntryDate: formattedEntries[0]?.dateObj,
      lastEntryDate: formattedEntries[formattedEntries.length-1]?.dateObj
    });
    
    // Get entries from the specified period
    const recentEntries = formattedEntries.filter(entry => {
      const isIncluded = entry.dateObj >= cutoffDate;
      console.log(`Entry ${format(entry.dateObj, "yyyy-MM-dd")}: ${isIncluded ? "included" : "excluded"} in ${days}-day period`);
      return isIncluded;
    });
    
    console.log(`${days}-day period filtered entries:`, { 
      count: recentEntries.length,
      dates: recentEntries.map(e => format(e.dateObj, "yyyy-MM-dd"))
    });
    
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
    
    console.log(`${days}-day period result:`, {
      oldest: format(oldestEntry.dateObj, "yyyy-MM-dd"),
      newest: format(newestEntry.dateObj, "yyyy-MM-dd"),
      daysDiff,
      weightDiff,
      avgDailyChange
    });
    
    return { 
      value: avgDailyChange.toFixed(2), 
      hasData: true,
      totalChange: weightDiff.toFixed(1),
      startWeight: oldestEntry.weight,
      endWeight: newestEntry.weight,
      startDate: format(oldestEntry.dateObj, "MMM d"),
      endDate: format(newestEntry.dateObj, "MMM d")
    };
  };

  // Use real calculated values instead of hardcoded test data
  const sevenDayAvg = calculatePeriodAverage(7);
  const fourteenDayAvg = calculatePeriodAverage(14);
  const thirtyDayAvg = calculatePeriodAverage(30);

  // Prepare chart data
  const chartData = {
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false,
        },
        background: 'transparent',
        fontFamily: 'Inter, sans-serif',
      },
      colors: ['#5865f2'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#5865f2',
              opacity: 0.2
            },
            {
              offset: 100,
              color: '#5865f2',
              opacity: 0
            }
          ]
        }
      },
      grid: {
        borderColor: '#1e1f22',
        strokeDashArray: 3,
        row: {
          colors: ['transparent'],
          opacity: 0.5
        },
      },
      annotations: {
        yaxis: [
          ...(goalWeight ? [{
            y: goalWeight,
            borderColor: '#57f287',
            borderWidth: 2,
            strokeDashArray: 5,
            label: {
              borderColor: '#57f287',
              style: {
                color: '#fff',
                background: '#57f287'
              },
              text: 'Goal'
            }
          }] : []),
          ...(startWeight ? [{
            y: startWeight,
            borderColor: '#fee75c',
            borderWidth: 2,
            strokeDashArray: 5,
            label: {
              borderColor: '#fee75c',
              style: {
                color: '#000',
                background: '#fee75c'
              },
              text: 'Start'
            }
          }] : [])
        ]
      },
      xaxis: {
        type: 'datetime',
        categories: [...formattedEntries].reverse().map(e => e.date),
        labels: {
          style: {
            colors: '#b5bac1',
          },
          format: 'MMM dd',
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#b5bac1',
          },
          formatter: (value) => `${value} kg`
        },
      },
      tooltip: {
        theme: 'dark',
        x: {
          format: 'MMM dd, yyyy'
        },
        y: {
          formatter: (value) => `${value} kg`
        }
      }
    },
    series: [{
      name: 'Weight',
      data: [...formattedEntries].reverse().map(e => e.weight)
    }]
  };

  // Calculate BMI
  const calculateBMI = (weightKg, heightCm) => {
    if (!weightKg || !heightCm) return null;
    
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return bmi.toFixed(1);
  };
  
  const getBMICategory = (bmi) => {
    if (!bmi) return "";
    
    if (bmi < 18.5) return { category: "Underweight", color: "text-[#fee75c]" };
    if (bmi < 25) return { category: "Healthy", color: "text-[#57f287]" };
    if (bmi < 30) return { category: "Overweight", color: "text-[#fee75c]" };
    return { category: "Obese", color: "text-[#ed4245]" };
  };
  
  const currentBMI = entries.length > 0 ? calculateBMI(entries[0].weight, height) : null;
  const bmiCategory = getBMICategory(currentBMI);
  
  // Calculate weight forecast and target date estimation
  const calculateForecast = () => {
    if (!sevenDayAvg.hasData || !goalWeight) return null;
    
    const avgDailyChange = parseFloat(sevenDayAvg.value);
    if (avgDailyChange === 0) return { isPossible: false, reason: "No change in weight trend" };
    
    const currentWeight = entries[0].weight;
    const weightDifference = goalWeight - currentWeight;
    
    // If weight trend doesn't align with goal (e.g., gaining when goal is to lose)
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
    const today = new Date(entries[0].date);
    const targetDate = addDays(today, daysNeeded);
    
    return {
      isPossible: true,
      daysNeeded,
      targetDate,
      targetDateFormatted: format(targetDate, "MMM d, yyyy"),
      weeklyRate: Math.abs(avgDailyChange * 7).toFixed(1)
    };
  };
  
  const forecast = goalWeight ? calculateForecast() : null;

  // Export data to CSV
  const exportToCsv = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Prepare CSV content
    let csvContent = "Date,Weight (kg)\n";
    
    // Add all entries
    formattedEntries.forEach(entry => {
      csvContent += `${format(entry.dateObj, "yyyy-MM-dd")},${entry.weight}\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weight-data-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Data exported successfully");
  };
  
  const handleSetHeight = () => {
    if (!height || isNaN(parseFloat(height))) {
      toast.error("Please enter a valid height");
      return;
    }
    
    toast.success("Height saved");
  };

  // Helper functions for weight distribution chart
  const getWeightRanges = () => {
    if (formattedEntries.length === 0) return [];
    
    // Get min and max weights
    const weights = formattedEntries.map(entry => entry.weight);
    const minWeight = Math.floor(Math.min(...weights));
    const maxWeight = Math.ceil(Math.max(...weights));
    
    // Create ranges (0.5kg increments)
    const ranges = [];
    for (let i = minWeight; i <= maxWeight; i += 0.5) {
      ranges.push(`${i.toFixed(1)}-${(i + 0.5).toFixed(1)}`);
    }
    
    return ranges;
  };

  const getWeightDistribution = () => {
    if (formattedEntries.length === 0) return [];
    
    const ranges = getWeightRanges();
    const distribution = new Array(ranges.length).fill(0);
    
    // Count days in each weight range
    formattedEntries.forEach(entry => {
      const weight = entry.weight;
      const rangeIndex = Math.floor((weight - Math.floor(Math.min(...formattedEntries.map(e => e.weight)))) * 2);
      if (rangeIndex >= 0 && rangeIndex < distribution.length) {
        distribution[rangeIndex]++;
      }
    });
    
    return distribution;
  };

  // If not yet client-side hydrated, show a loading state
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#2b2d31] text-[#e3e5e8] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Loading Weight Tracker...</p>
          <div className="w-10 h-10 border-4 border-t-[#5865f2] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2b2d31] text-[#e3e5e8] p-4 md:p-6">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: "#313338",
            color: "#e3e5e8",
            border: "1px solid #1e1f22",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          },
          success: {
            icon: "✅",
          },
          error: {
            icon: "❌",
          }
        }}
      />

      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white">Weight Tracker</h1>
          <p className="text-[#b5bac1]">Track your weight over time with a simple spreadsheet-like interface</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Settings */}
          <Card className="bg-[#313338] border-[#1e1f22] shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
              <CardTitle className="text-[#f2f3f5] text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
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
                      className="bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8] h-10 pl-3"
                    />
                    <button
                      onClick={handleSetStart}
                      className="px-4 py-2 h-10 bg-[#404249] hover:bg-[#4752c4] text-white rounded-md flex items-center space-x-1 border border-[#1e1f22]"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
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
                      className="bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8] h-10 pl-3"
                    />
                    <button
                      onClick={handleSetGoal}
                      className="px-4 py-2 h-10 bg-[#404249] hover:bg-[#4752c4] text-white rounded-md flex items-center space-x-1 border border-[#1e1f22]"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
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
                      className="bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8] h-10 pl-3"
                    />
                    <button
                      onClick={handleSetHeight}
                      className="px-4 py-2 h-10 bg-[#404249] hover:bg-[#4752c4] text-white rounded-md flex items-center space-x-1 border border-[#1e1f22]"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span>Set</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Chart */}
          <Card className="bg-[#313338] border-[#1e1f22] shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
              <CardTitle className="text-[#f2f3f5] text-lg">Weight Chart</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="h-[300px]">
                {entries.length > 0 ? (
                  typeof window !== 'undefined' ? 
                    <Chart 
                      options={chartData.options} 
                      series={chartData.series} 
                      type="area" 
                      height={300}
                    />
                  : <div>Loading chart...</div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#b5bac1]">
                    <p className="mb-2">No data available yet.</p>
                    <button 
                      onClick={() => {
                        const input = document.querySelector('input[type="number"]');
                        if (input) input.focus();
                      }} 
                      className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md border border-[#4752c4]"
                    >
                      Add Your First Weight
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Left column - Add New Entry */}
          <Card className="bg-[#313338] border-[#1e1f22] shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
              <CardTitle className="text-[#f2f3f5] text-lg">Add New Entry</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#b5bac1] mb-2 pl-1">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8] h-10 pl-3 pr-8"
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
                      className="bg-[#1e1f22] border-[#1e1f22] text-[#e3e5e8] h-10 pl-3"
                    />
                    <button 
                      onClick={handleAdd} 
                      className="px-4 py-2 h-10 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md border border-[#4752c4]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Weight History */}
          <Card className="bg-[#313338] border-[#1e1f22] shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-center border-b border-[#1e1f22] pb-3 pt-4">
              <CardTitle className="text-[#f2f3f5] text-lg">Weight History</CardTitle>
              <div className="text-sm text-[#b5bac1] ml-2">({entries.length} entries)</div>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="overflow-x-auto max-h-[350px]">
                {entries.length > 0 ? (
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 bg-[#313338] z-10">
                      <TableRow>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedEntries.map((entry, index) => {
                        const prevEntry = formattedEntries[index + 1];
                        const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                        const changeColor = change !== "--" ? 
                          (parseFloat(change) < 0 ? "text-[#57f287]" : parseFloat(change) > 0 ? "text-[#ed4245]" : "") 
                          : "";
                        
                        return (
                          <TableRow key={entry.id || entry.date}>
                            <TableCell className="text-[#e3e5e8]">{entry.dateFormatted}</TableCell>
                            <TableCell className="text-[#b5bac1]">{entry.dayFormatted}</TableCell>
                            <TableCell className="text-[#e3e5e8] font-medium">{entry.weight}</TableCell>
                            <TableCell className={`${changeColor} flex items-center`}>
                              {change !== "--" ? (
                                <>
                                  <span>{change > 0 ? "+" + change : change}</span>
                                  <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                                </>
                              ) : "--"}
                            </TableCell>
                            <TableCell className="text-right">
                              <button 
                                onClick={() => handleDelete(entry.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#ed4245] hover:text-red-400 hover:bg-[#4b2325]"
                              >
                                <Trash2 size={16} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-[#b5bac1]">
                    <p>No entries yet. Add your first weight using the form.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card - Spans full width on larger screens */}
          {entries.length > 0 && (
            <Card className="bg-[#313338] border-[#1e1f22] shadow-xl md:col-span-2 rounded-lg overflow-hidden">
              <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
                <CardTitle className="text-[#f2f3f5] text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#2b2d31] p-4 rounded-md">
                    <div className="text-sm text-[#b5bac1] mb-1">Current</div>
                    <div className="text-xl font-bold text-white">{entries[0].weight} kg</div>
                  </div>
                  
                  {goalWeight && (
                    <div className="bg-[#2b2d31] p-4 rounded-md">
                      <div className="text-sm text-[#b5bac1] mb-1">Goal</div>
                      <div className="text-xl font-bold text-white">{goalWeight} kg</div>
                    </div>
                  )}
                  
                  {startWeight && entries.length > 0 && (
                    <div className="bg-[#2b2d31] p-4 rounded-md">
                      <div className="text-sm text-[#b5bac1] mb-1">Total Change</div>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-white mr-1">
                          {(entries[0].weight - startWeight).toFixed(1)} kg
                        </span>
                        {getTrendIcon(entries[0].weight - startWeight)}
                      </div>
                    </div>
                  )}
                  
                  {entries.length > 1 && (
                    <div className="bg-[#2b2d31] p-4 rounded-md">
                      <div className="text-sm text-[#b5bac1] mb-1">Last Change</div>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-white mr-1">
                          {(entries[0].weight - entries[1].weight).toFixed(1)} kg
                        </span>
                        {getTrendIcon(entries[0].weight - entries[1].weight)}
                      </div>
                    </div>
                  )}

                  {/* BMI Card */}
                  {height && entries.length > 0 && (
                    <div className="bg-[#2b2d31] p-4 rounded-md">
                      <div className="text-sm text-[#b5bac1] mb-1">BMI</div>
                      <div className="text-xl font-bold text-white">{currentBMI}</div>
                      <div className={`text-sm ${bmiCategory.color} mt-1`}>{bmiCategory.category}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Forecast Card */}
          {entries.length > 0 && goalWeight && sevenDayAvg.hasData && (
            <Card className="bg-[#313338] border-[#1e1f22] shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2">
              <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
                <CardTitle className="text-[#f2f3f5] text-lg">Forecast</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Weight Projection */}
                  <div className="bg-[#2b2d31] p-4 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-[#f2f3f5]">Weight Projection</h3>
                    </div>
                    
                    {forecast?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Current trend:</span>
                          <span className="font-medium text-white">
                            {sevenDayAvg.value > 0 ? "+" : ""}{sevenDayAvg.value} kg/day
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Weekly rate:</span>
                          <span className="font-medium text-white">{forecast.weeklyRate} kg/week</span>
                        </div>
                        <div className="h-[1px] w-full bg-[#1e1f22] my-3"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Current:</span>
                          <span className="font-medium text-white">{entries[0].weight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Goal:</span>
                          <span className="font-medium text-white">{goalWeight} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Remaining:</span>
                          <span className="font-medium text-white">
                            {Math.abs(goalWeight - entries[0].weight).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-[#ed4245]">
                        {forecast ? forecast.reason : "Insufficient data for projection"}
                      </div>
                    )}
                  </div>
                  
                  {/* Target Date */}
                  <div className="bg-[#2b2d31] p-4 rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-[#f2f3f5]">Target Date Estimation</h3>
                      <Calendar size={20} className="text-[#b5bac1]" />
                    </div>
                    
                    {forecast?.isPossible ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Estimated time to goal:</span>
                          <span className="font-medium text-white">{forecast.daysNeeded} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#b5bac1]">Target date:</span>
                          <span className="font-medium text-white">{forecast.targetDateFormatted}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#1e1f22]">
                          <div className="flex items-center space-x-2 text-sm text-[#b5bac1]">
                            <span>Today</span>
                            <div className="flex-1 h-[3px] bg-[#4752c4] rounded-full relative">
                              <div 
                                className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-[#5865f2]"
                                style={{ left: "0%" }}
                              ></div>
                              <div 
                                className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-[#57f287]"
                                style={{ right: "0%" }}
                              ></div>
                            </div>
                            <span>{forecast.targetDateFormatted}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center flex flex-col items-center space-y-4">
                        <ArrowRight size={32} className="text-[#b5bac1]" />
                        <span className="text-[#b5bac1]">
                          {forecast ? forecast.reason : "Set a goal weight and establish a trend"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Export Card */}
          {entries.length > 0 && (
            <Card className="bg-[#313338] border-[#1e1f22] shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2">
              <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center relative">
                <CardTitle className="text-[#f2f3f5] text-lg">Data Management</CardTitle>
                <button
                  onClick={exportToCsv}
                  className="px-3 py-1 bg-[#404249] hover:bg-[#4752c4] text-white rounded-md flex items-center space-x-1 border border-[#1e1f22] absolute right-6"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span>Export CSV</span>
                </button>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="text-[#b5bac1]">
                  <p>Your weight data is stored locally in your browser. You can export it as a CSV file for backup or analysis in other applications.</p>
                  <div className="mt-4 bg-[#2b2d31] p-4 rounded-md">
                    <div className="text-sm">
                      <span className="text-[#f2f3f5] font-medium">Current data summary:</span>
                      <ul className="mt-2 space-y-1">
                        <li>• Total entries: {entries.length}</li>
                        <li>• Date range: {format(formattedEntries[formattedEntries.length-1].dateObj, "MMM d, yyyy")} to {format(formattedEntries[0].dateObj, "MMM d, yyyy")}</li>
                        <li>• Weight range: {Math.min(...formattedEntries.map(e => e.weight))} kg to {Math.max(...formattedEntries.map(e => e.weight))} kg</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Statistics Card with Average Tables */}
          {entries.length > 1 && (
            <Card className="bg-[#313338] border-[#1e1f22] shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2">
              <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
                <CardTitle className="text-[#f2f3f5] text-lg">Weight Averages</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
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
                      {sevenDayAvg.hasData && (
                        <TableRow>
                          <TableCell className="font-medium">7 Days</TableCell>
                          <TableCell>{sevenDayAvg.startDate} - {sevenDayAvg.endDate}</TableCell>
                          <TableCell>{sevenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{sevenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={parseFloat(sevenDayAvg.totalChange) < 0 
                              ? "text-[#57f287]" 
                              : parseFloat(sevenDayAvg.totalChange) > 0 
                                ? "text-[#ed4245]" 
                                : ""
                            }
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
                      
                      {fourteenDayAvg.hasData && (
                        <TableRow>
                          <TableCell className="font-medium">14 Days</TableCell>
                          <TableCell>{fourteenDayAvg.startDate} - {fourteenDayAvg.endDate}</TableCell>
                          <TableCell>{fourteenDayAvg.startWeight} kg</TableCell>
                          <TableCell>{fourteenDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={parseFloat(fourteenDayAvg.totalChange) < 0 
                              ? "text-[#57f287]" 
                              : parseFloat(fourteenDayAvg.totalChange) > 0 
                                ? "text-[#ed4245]" 
                                : ""
                            }
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
                      
                      {thirtyDayAvg.hasData && (
                        <TableRow>
                          <TableCell className="font-medium">30 Days</TableCell>
                          <TableCell>{thirtyDayAvg.startDate} - {thirtyDayAvg.endDate}</TableCell>
                          <TableCell>{thirtyDayAvg.startWeight} kg</TableCell>
                          <TableCell>{thirtyDayAvg.endWeight} kg</TableCell>
                          <TableCell 
                            className={parseFloat(thirtyDayAvg.totalChange) < 0 
                              ? "text-[#57f287]" 
                              : parseFloat(thirtyDayAvg.totalChange) > 0 
                                ? "text-[#ed4245]" 
                                : ""
                            }
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
                      
                      {!sevenDayAvg.hasData && !fourteenDayAvg.hasData && !thirtyDayAvg.hasData && (
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
          )}
          
          {/* Weight Distribution Card */}
          {entries.length > 5 && (
            <Card className="bg-[#313338] border-[#1e1f22] shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2">
              <CardHeader className="border-b border-[#1e1f22] pb-3 pt-4 flex justify-center">
                <CardTitle className="text-[#f2f3f5] text-lg">Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent className="py-6 px-6">
                <div className="h-[200px]">
                  {typeof window !== 'undefined' && (
                    <Chart 
                      options={{
                        chart: {
                          type: 'bar',
                          height: 200,
                          toolbar: {
                            show: false,
                          },
                          background: 'transparent',
                          fontFamily: 'Inter, sans-serif',
                        },
                        colors: ['#5865f2'],
                        plotOptions: {
                          bar: {
                            horizontal: false,
                            columnWidth: '70%',
                            borderRadius: 4,
                            distributed: true,
                          }
                        },
                        dataLabels: {
                          enabled: false
                        },
                        grid: {
                          borderColor: '#1e1f22',
                          strokeDashArray: 3,
                          row: {
                            colors: ['transparent'],
                            opacity: 0.5
                          },
                        },
                        xaxis: {
                          categories: getWeightRanges(),
                          labels: {
                            style: {
                              colors: '#b5bac1',
                            },
                          },
                          axisBorder: {
                            show: false
                          },
                          axisTicks: {
                            show: false
                          }
                        },
                        yaxis: {
                          title: {
                            text: 'Days',
                            style: {
                              color: '#b5bac1'
                            }
                          },
                          labels: {
                            style: {
                              colors: '#b5bac1',
                            },
                          },
                        },
                        tooltip: {
                          theme: 'dark',
                          y: {
                            formatter: (value) => `${value} days`
                          }
                        }
                      }} 
                      series={[{
                        name: 'Days at Weight',
                        data: getWeightDistribution()
                      }]} 
                      type="bar" 
                      height={200}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
