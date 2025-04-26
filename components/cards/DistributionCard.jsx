"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart } from "lucide-react";
import * as Stats from "../../stats.js";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function DistributionCard({ colors, entries, theme }) {
  // State to track if chart data is ready
  const [chartReady, setChartReady] = useState(false);
  const [chartOptions, setChartOptions] = useState(null);
  const [chartSeries, setChartSeries] = useState(null);

  // Skip rendering if no entries or too few entries
  if (!entries || entries.length < 5) {
    return null;
  }

  // Safe formatter
  const safeFormat = (value, decimals = 1) => {
    if (value === undefined || value === null) return "N/A";
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

  // Manually prepare distribution data to avoid issues with ApexCharts
  const prepareDistributionData = () => {
    try {
      // Get raw entries and validate
      if (!entries || entries.length < 5) {
        return { categories: [], data: [] };
      }

      // Get weights from entries
      const weights = entries.map(entry => parseFloat(entry.weight)).filter(w => !isNaN(w));
      if (weights.length < 5) {
        return { categories: [], data: [] };
      }

      // Calculate min and max weight
      const minWeight = Math.floor(Math.min(...weights));
      const maxWeight = Math.ceil(Math.max(...weights));

      // Create weight ranges in 0.5kg increments
      const ranges = [];
      for (let i = minWeight; i <= maxWeight; i += 0.5) {
        ranges.push({
          range: `${i.toFixed(1)}-${(i + 0.5).toFixed(1)}`,
          count: 0
        });
      }

      // Count entries in each range
      weights.forEach(weight => {
        for (let i = 0; i < ranges.length; i++) {
          const [min, max] = ranges[i].range.split('-').map(parseFloat);
          if (weight >= min && weight < max) {
            ranges[i].count++;
            break;
          }
        }
      });

      // Filter out empty ranges and prepare data for chart
      const filteredRanges = ranges.filter(range => range.count > 0);
      const categories = filteredRanges.map(r => r.range);
      const data = filteredRanges.map(r => r.count);

      return { categories, data };
    } catch (error) {
      console.error("Error preparing distribution data:", error);
      return { categories: [], data: [] };
    }
  };

  // Set up chart data and options
  useEffect(() => {
    try {
      // Get distribution data
      const { categories, data } = prepareDistributionData();
      
      // Verify we have data to display
      if (categories.length === 0 || data.length === 0) {
        console.log("No distribution data available");
        setChartReady(false);
        return;
      }

      // Create chart options
      const options = {
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
          show: false,
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
          categories: categories,
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
      };

      const series = [{
        name: 'Days at Weight',
        data: data
      }];

      setChartOptions(options);
      setChartSeries(series);
      setChartReady(true);
      console.log("Chart data prepared successfully:", { categories, data });
    } catch (error) {
      console.error("Error setting up chart:", error);
      setChartReady(false);
    }
  }, [entries, theme]);

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl md:col-span-2 rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg flex items-center`}>
          <BarChart className="mr-2 h-5 w-5" />
          Weight Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="h-[200px]">
          {typeof window !== 'undefined' && chartReady && chartOptions && chartSeries ? (
            <Chart 
              options={chartOptions}
              series={chartSeries}
              type="bar" 
              height={200}
            />
          ) : (
            <div className={`flex items-center justify-center h-full ${colors.textMuted}`}>
              {chartReady === false ? "Processing weight distribution data..." : "Loading chart..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DistributionCard; 