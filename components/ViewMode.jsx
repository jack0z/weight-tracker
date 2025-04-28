"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import * as Stats from '../stats.js';

// Dynamically import ApexCharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ViewMode({ data = {}, theme = 'dark' }) {
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
        <div className={`flex items-center gap-1 mb-4`}>
          <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold`}>
            Weight Tracker
          </h2>
          <span className={`ml-2 text-xs sm:text-sm ${colors.textMuted}`}>
            (Shared by {sharedBy})
          </span>
        </div>

        {/* Rest of your return JSX - same as original but using formattedEntries */}
        {/* ... */}
      </div>
    </div>
  );
}