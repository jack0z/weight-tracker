"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Trash2, Download, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";
import * as Export from "../../export.js";
import * as Data from "../../data.js";

function HistoryCard({ colors, formattedEntries, entries, setEntries, theme }) {
  // Handler function for deleting entries
  const handleDelete = (id) => {
    // Use our Data module to delete an entry
    const updatedEntries = Data.deleteEntry(id, entries);
    setEntries(updatedEntries);
    toast.success("Entry deleted");
  };

  // Export function
  const exportToCsv = () => {
    if (entries.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const success = Export.exportToCsv(entries);
    
    if (success) {
      toast.success("Data exported successfully");
    } else {
      toast.error("Error exporting data");
    }
  };

  // Get trend icon
  const getTrendIcon = (value) => {
    if (!value || value === 0) return <Minus className={`h-4 w-4 ${colors.textMuted}`} />;
    return value < 0 ? 
      <TrendingDown className={`h-4 w-4 ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'}`} /> : 
      <TrendingUp className={`h-4 w-4 ${colors.negative}`} />;
  };

  return (
    <Card className={`${colors.cardBg} ${colors.border} shadow-xl rounded-lg overflow-hidden`}>
      <CardHeader className={`border-b ${colors.border} relative flex flex-row items-center justify-center pb-3 pt-4`}>
        <div className="flex items-center">
          <CardTitle className={`${colors.text} text-lg`}>Weight History</CardTitle>
          <div className="text-sm ${theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]'} ml-2">({entries.length} entries)</div>
        </div>
        <button
          onClick={exportToCsv}
          disabled={entries.length === 0}
          className={`${colors.buttonBgPrimary} px-3 py-1 text-xs rounded-md flex items-center absolute right-4
            ${entries.length > 0 
              ? 'bg-[#404249] hover:bg-[#4752c4] text-white cursor-pointer' 
              : 'bg-[#36373d] text-[#72767d] cursor-not-allowed'}`}
          title="Export to CSV"
        >
          <Download size={14} className="mr-1 text-white" />
          <span className="text-white">Export</span>
        </button>
      </CardHeader>
      <CardContent className={`py-6 px-6 overflow-hidden`}>
        <div style={{ maxHeight: '350px', overflow: 'auto' }} className="scrollbar-hide">
          {entries.length > 0 ? (
            <div className="relative">
              <table className="w-full">
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }} className={`${theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]'}`}>
                  <tr>
                    <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`} style={{ width: '150px' }}>Date</th>
                    <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Day</th>
                    <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Weight (kg)</th>
                    <th className={`text-left py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Change</th>
                    <th className={`text-right py-2 px-4 font-medium ${colors.text} border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedEntries.map((entry, index) => {
                    const prevEntry = formattedEntries[index + 1];
                    const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
                    const changeColor = change !== "--" ? 
                      (parseFloat(change) < 0 ? 
                        theme === 'dark' ? "text-[#57f287]" : "text-[#126134]"
                        : parseFloat(change) > 0 ? "text-[#ed4245]" : "") 
                      : "";
                    
                    return (
                      <tr 
                        key={entry.id || entry.date} 
                        className={`border-b ${theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]'} ${theme === 'dark' ? 'hover:bg-[#2b2d31]' : 'hover:bg-[#f5f2e8]'} transition-colors duration-150`}
                      >
                        <td className={`text-left py-2 px-4 ${colors.text}`}>{entry.dateFormatted}</td>
                        <td className={`text-left py-2 px-4 ${colors.text}`}>{entry.dayFormatted}</td>
                        <td className={`text-left py-2 px-4 ${colors.text} font-medium`}>{entry.weight}</td>
                        <td className={`text-left py-2 px-4 ${changeColor} flex items-center`}>
                          {change !== "--" ? (
                            <>
                              <span>{change > 0 ? "+" + change : change}</span>
                              <span className="ml-1">{getTrendIcon(parseFloat(change))}</span>
                            </>
                          ) : "--"}
                        </td>
                        <td className="text-right py-2 px-4">
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className={`${theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#8DA101] hover:bg-[#798901]'} inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors duration-150`}
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-[#b5bac1]">
              <p>No entries yet. Add your first weight using the form.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoryCard; 