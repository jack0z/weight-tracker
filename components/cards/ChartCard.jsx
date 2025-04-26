"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function ChartCard({ colors, entries, chartConfig }) {
  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} pb-3 pt-4 flex justify-center`}>
        <CardTitle className={`${colors.text} text-lg`}>Weight Chart</CardTitle>
      </CardHeader>
      <CardContent className={`py-6 px-6`}>
        <div className="h-[300px]">
          {entries.length > 0 ? (
            typeof window !== 'undefined' ? 
              <Chart 
                options={chartConfig.options} 
                series={chartConfig.series} 
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
                className={`${colors.buttonBgPrimary} px-4 py-2 rounded-md border border-[#4752c4]`}
              >
                Add Your First Weight
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartCard; 