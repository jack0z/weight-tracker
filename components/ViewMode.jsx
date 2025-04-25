import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Sun, Moon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";
import { Toaster, toast } from 'sonner';
import dynamic from "next/dynamic";
import * as Stats from '../stats.js';

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/**
 * View-only mode component for shared weight tracker data
 *
 * @param {Object} props - Component props
 * @param {Array} props.entries - Weight entries
 * @param {string|number} props.startWeight - Starting weight
 * @param {string|number} props.goalWeight - Goal weight
 * @param {string|number} props.height - User height
 * @param {string} props.theme - Current theme
 * @param {string} props.sharedBy - Username who shared the data
 * @param {function} props.onThemeToggle - Function to toggle theme
 * @param {function} props.onExit - Function to exit view mode
 */
export default function ViewMode({ 
  entries, 
  startWeight, 
  goalWeight, 
  height, 
  theme, 
  sharedBy,
  onThemeToggle,
  onExit
}) {
  const [formattedEntries, setFormattedEntries] = useState([]);
  const [chartData, setChartData] = useState({
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false },
        background: 'transparent',
      },
      xaxis: { type: 'datetime' }
    },
    series: [{ name: 'Weight', data: [] }]
  });

  // Define colors based on theme
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    buttonBgPrimary: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    buttonBgSecondary: theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#939F91] hover:bg-[#8A948C]',
    positive: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
    negative: theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]',
  };

  // Format entries and prepare chart data
  useEffect(() => {
    if (entries && entries.length > 0) {
      // Format entries for display
      const formatted = entries.map(e => ({
        ...e,
        dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
        dayFormatted: format(new Date(e.date), "EEEE"),
        dateObj: new Date(e.date)
      })).sort((a, b) => b.dateObj - a.dateObj);
      
      setFormattedEntries(formatted);
      
      // Prepare chart data
      const chartConfig = {
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
          colors: theme === 'dark' ? ['#5865f2'] : ['#8DA101'],
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
              stops: [0, 90, 100]
            }
          },
          grid: {
            borderColor: theme === 'dark' ? '#1e1f22' : '#e5e7eb',
            strokeDashArray: 3,
            row: {
              colors: ['transparent'],
              opacity: 0.5
            },
            xaxis: {
              lines: {
                show: false
              }
            }
          },
          xaxis: {
            type: 'datetime',
            categories: [...formatted].reverse().map(e => e.date),
            labels: {
              style: {
                colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
              },
              format: 'MMM dd',
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: theme === 'dark' ? '#b5bac1' : '#6b7280',
              },
              formatter: (value) => `${value} kg`
            },
          },
          tooltip: {
            theme: theme === 'dark' ? 'dark' : 'light',
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
          data: [...formatted].reverse().map(e => parseFloat(e.weight))
        }]
      };
      
      setChartData(chartConfig);
    }
  }, [entries, theme]);

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  // Calculate BMI if both weight and height are available
  const calculateBMI = () => {
    if (!height || !entries || entries.length === 0) return null;
    
    const latestWeight = entries[0].weight;
    const heightM = parseFloat(height) / 100;
    return (latestWeight / (heightM * heightM)).toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-500" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500" };
    return { category: "Obese", color: "text-red-500" };
  };

  // Calculate weight ranges and distribution
  const getWeightRanges = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightRanges(entries);
  };
  
  const getWeightDistribution = () => {
    if (!entries || entries.length < 5) return [];
    return Stats.getWeightDistribution(entries);
  };

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-4 md:p-6`}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
          }
        }}
      />
      
      <div className="max-w-6xl mx-auto">
        {/* Header with info and controls */}
        <div className={`flex justify-between items-center mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          <div className="flex items-center gap-1">
            <h2 className={`text-xl sm:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Weight Tracker
            </h2>
            <span className={`ml-2 text-sm ${colors.textMuted}`}>(Shared by {sharedBy})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-full ${theme === 'dark' ? colors.buttonBgSecondary : 'bg-[#8DA101] hover:bg-[#798901]'}`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-white" />
              ) : (
                <Moon size={16} className="text-white" />
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Chart - View Only */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden md:col-span-2`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-lg`}>Weight Chart</CardTitle>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="h-[300px]">
                {entries && entries.length > 0 ? (
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
                    <p className="mb-2">No data available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Card - If data available */}
          {entries && entries.length > 0 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden md:col-span-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${colors.text} text-lg`}>Summary</CardTitle>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-4 rounded-md`}>
                    <div className="text-sm text-[#b5bac1] mb-1">Current</div>
                    <div className={`text-xl font-bold ${colors.text}`}>{entries[0].weight} kg</div>
                  </div>
                  
                  {goalWeight && (
                    <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-4 rounded-md`}>
                      <div className="text-sm text-[#b5bac1] mb-1">Goal</div>
                      <div className={`text-xl font-bold ${colors.text}`}>{goalWeight} kg</div>
                    </div>
                  )}
                  
                  {startWeight && (
                    <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-4 rounded-md`}>
                      <div className="text-sm text-[#b5bac1] mb-1">Total Change</div>
                      <div className="flex items-center">
                        <span className={`text-xl font-bold ${colors.text} mr-1`}>
                          {(entries[0].weight - startWeight).toFixed(1)} kg
                        </span>
                        {getTrendIcon(entries[0].weight - startWeight)}
                      </div>
                    </div>
                  )}
                  
                  {/* BMI Card */}
                  {height && calculateBMI() && (
                    <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-4 rounded-md`}>
                      <div className="text-sm text-[#b5bac1] mb-1">BMI</div>
                      <div className={`text-xl font-bold ${colors.text}`}>{calculateBMI()}</div>
                      <div className={`text-sm ${getBMICategory(calculateBMI()).color} mt-1`}>
                        {getBMICategory(calculateBMI()).category}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Weight History - View Only */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden md:col-span-2`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-lg`}>Weight History</CardTitle>
              <div className={`text-sm ${colors.textMuted} ml-2`}>({formattedEntries.length} entries)</div>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <div className="overflow-x-auto max-h-[350px]">
                {formattedEntries.length > 0 ? (
                  <Table className="w-full">
                    <TableHeader className={`sticky top-0 ${theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]'} z-10`}>
                      <TableRow>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formattedEntries.map((entry, index) => {
                        const prevEntry = formattedEntries[index + 1];
                        const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                        const changeColor = change !== "--" ? 
                          (parseFloat(change) < 0 ? 
                            theme === 'dark' ? "text-[#57f287]" : "text-[#126134]"
                            : parseFloat(change) > 0 ? "text-[#ed4245]" : "") 
                          : "";
                        
                        return (
                          <TableRow key={entry.id || entry.date}>
                            <TableCell className={`${colors.text}`}>{entry.dateFormatted}</TableCell>
                            <TableCell className={`${colors.text}`}>{entry.dayFormatted}</TableCell>
                            <TableCell className={`${colors.text} font-medium`}>{entry.weight}</TableCell>
                            <TableCell className={`${changeColor} flex items-center`}>
                              {change !== "--" ? (
                                <>
                                  <span>{change > 0 ? "+" + change : change}</span>
                                  <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                                </>
                              ) : "--"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-[#b5bac1]">
                    <p>No entries available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Weight Distribution Card */}
          {entries.length >= 5 && (
            <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden mt-2`}>
              <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
                <CardTitle className={`${colors.text} text-lg`}>Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent className={`py-6 px-6`}>
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
                        colors: theme === 'dark' ? ['#5865f2'] : ['#8DA101'],
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
                          show: false,  // Hide all grid lines
                          borderColor: '#1e1f22',
                          strokeDashArray: 3,
                          padding: {
                            left: 0,
                            right: 0
                          },
                          xaxis: {
                            lines: {
                              show: false
                            }
                          },
                          yaxis: {
                            lines: {
                              show: false
                            }
                          }
                        },
                        xaxis: {
                          categories: getWeightRanges(),
                          labels: {
                            style: {
                              colors: '#b5bac1',
                            },
                            rotate: -45,
                            rotateAlways: false,
                            hideOverlappingLabels: true,
                            trim: true,
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
                          theme: theme === 'dark' ? 'dark' : 'light',
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