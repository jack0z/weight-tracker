"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TrendingDown, TrendingUp, Minus, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import * as Stats from '../stats.js';

// Dynamically import ApexCharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ViewMode({ data = {}, theme = 'dark', onThemeToggle }) {
  const { 
    entries = [], 
    settings = {},
    user: sharedBy
  } = data || {};

  const [formattedEntries, setFormattedEntries] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Colors based on theme
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    positive: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
    negative: theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]',
  };

  // Format entries on mount
  useEffect(() => {
    if (entries?.length > 0) {
      const formatted = entries.map(e => ({
        ...e,
        dateFormatted: format(new Date(e.date), "MMM d, yyyy"),
        dayFormatted: format(new Date(e.date), "EEEE"),
        dateObj: new Date(e.date)
      })).sort((a, b) => b.dateObj - a.dateObj);
      
      setFormattedEntries(formatted);
    }
    setIsClient(true);
  }, [entries]);

  // Chart configuration
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
        categories: [...formattedEntries].reverse().map(e => e.date),
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
      data: [...formattedEntries].reverse().map(e => parseFloat(e.weight))
    }]
  };

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${colors.positive}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-3 sm:p-4 md:p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`flex justify-between items-center mb-4`}>
          <div className="flex items-center gap-1">
            <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold`}>
              Weight Tracker
            </h2>
            <span className={`ml-2 text-xs sm:text-sm ${colors.textMuted}`}>
              (Shared by {sharedBy})
            </span>
          </div>
          
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#8DA101] hover:bg-[#798901]'}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-white" />
            ) : (
              <Moon size={16} className="text-white" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Weight Chart */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>Weight Chart</CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-2 sm:py-6 sm:px-6">
              <div className="h-[250px] sm:h-[300px]">
                {isClient && (
                  <Chart 
                    options={chartConfig.options} 
                    series={chartConfig.series} 
                    type="area" 
                    height="100%"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>Summary</CardTitle>
            </CardHeader>
            <CardContent className={`py-4 px-3 sm:py-6 sm:px-6`}>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                  <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Current</div>
                  <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>
                    {formattedEntries[0]?.weight || '--'} kg
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                  <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Goal</div>
                  <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>
                    {settings.goalWeight || '--'} kg
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                  <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">Total Change</div>
                  <div className="flex items-center">
                    <span className={`text-lg sm:text-xl font-bold ${colors.text} mr-1`}>
                      {formattedEntries[0] && settings.startWeight
                        ? (formattedEntries[0].weight - settings.startWeight).toFixed(1)
                        : '--'} kg
                    </span>
                    {formattedEntries[0] && settings.startWeight && 
                      getTrendIcon(formattedEntries[0].weight - settings.startWeight)}
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                  <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">BMI</div>
                  <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>
                    {formattedEntries[0] && settings.height
                      ? (formattedEntries[0].weight / Math.pow(settings.height / 100, 2)).toFixed(1)
                      : '--'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight History Table */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>
                Weight History 
                <span className={`text-xs sm:text-sm ${colors.textMuted} ml-2`}>
                  ({formattedEntries.length} entries)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-2 sm:py-6 sm:px-6">
              <div className="overflow-x-auto max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formattedEntries.map((entry, index) => {
                      const prevEntry = formattedEntries[index + 1];
                      const change = prevEntry 
                        ? (entry.weight - prevEntry.weight).toFixed(1)
                        : null;
                      
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.dateFormatted}</TableCell>
                          <TableCell>{entry.dayFormatted}</TableCell>
                          <TableCell>{entry.weight}</TableCell>
                          <TableCell className="flex items-center">
                            {change !== null ? (
                              <>
                                <span className={change < 0 ? colors.positive : change > 0 ? colors.negative : ''}>
                                  {change > 0 ? `+${change}` : change}
                                </span>
                                {getTrendIcon(parseFloat(change))}
                              </>
                            ) : '--'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Weight Averages */}
          <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
            <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
              <CardTitle className={`${colors.text} text-base sm:text-lg`}>Weight Averages</CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-2 sm:py-6 sm:px-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { period: '7-day', days: 7 },
                  { period: '14-day', days: 14 },
                  { period: '30-day', days: 30 }
                ].map(({ period, days }) => {
                  const avg = Stats.calculatePeriodAverage(entries, days);
                  return (
                    <div key={period} className={`${theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]'} p-3 sm:p-4 rounded-md`}>
                      <div className="text-xs sm:text-sm text-[#b5bac1] mb-1">{period}</div>
                      <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>
                        {avg.total > 0 ? `${avg.average.toFixed(1)} kg` : 'Not enough entries'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}