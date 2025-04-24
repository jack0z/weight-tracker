// export.js - Import and export functionality for weight tracker

/**
 * Export weight entries to CSV file
 * @param {Array} entries - Array of weight entries
 * @returns {boolean} - Success status
 */
function exportToCsv(entries) {
  if (!entries || entries.length === 0) {
    return false;
  }
  
  // Format date function
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // Prepare CSV content
  let csvContent = "Date,Weight (kg)\n";
  
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Add all entries
  sortedEntries.forEach(entry => {
    csvContent += `${formatDate(entry.date)},${entry.weight}\n`;
  });
  
  // Create a blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `weight-data-${formatDate(new Date())}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return true;
}

/**
 * Parse CSV or Excel file and extract weight data
 * @param {File} file - File object from input element
 * @returns {Promise<Array>} - Promise resolving to array of weight entries
 */
function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const rows = content.split(/\r?\n/);
        
        // Try to determine which columns contain date and weight
        const headerRow = rows[0].split(',');
        let dateColumnIndex = -1;
        let weightColumnIndex = -1;
        
        // Look for date and weight columns in header
        headerRow.forEach((header, index) => {
          const headerLower = header.toLowerCase();
          if (headerLower.includes('date') || headerLower.includes('day')) {
            dateColumnIndex = index;
          }
          if (headerLower.includes('weight') || headerLower.includes('kg') || headerLower.includes('lbs')) {
            weightColumnIndex = index;
          }
        });
        
        // If we couldn't find the columns, make best guess
        if (dateColumnIndex === -1) dateColumnIndex = 0; // Usually first column is date
        if (weightColumnIndex === -1) weightColumnIndex = 1; // Usually second column is weight
        
        // Parse the entries
        const entries = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const columns = rows[i].split(',');
          if (columns.length < 2) continue; // Skip malformed rows
          
          const dateStr = columns[dateColumnIndex].trim();
          const weightStr = columns[weightColumnIndex].trim();
          
          // Parse date - support multiple formats
          let dateObj;
          // Try YYYY-MM-DD
          if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
            dateObj = new Date(dateStr);
          } 
          // Try MM/DD/YYYY
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const [month, day, year] = dateStr.split('/');
            dateObj = new Date(year, month - 1, day);
          }
          // Try DD/MM/YYYY
          else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('/');
            dateObj = new Date(year, month - 1, day);
          } else {
            // Try to use JavaScript's native parser as fallback
            dateObj = new Date(dateStr);
          }
          
          // Validate date
          if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date format at row ${i+1}: ${dateStr}`);
            continue;
          }
          
          // Parse weight
          const weight = parseFloat(weightStr);
          if (isNaN(weight)) {
            console.warn(`Invalid weight format at row ${i+1}: ${weightStr}`);
            continue;
          }
          
          // Add valid entry
          entries.push({
            id: Date.now() + i, // Generate a unique ID
            date: dateObj.toISOString(),
            weight: weight
          });
        }
        
        resolve(entries);
      } catch (error) {
        console.error('Error parsing file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

// Export functions
export {
  exportToCsv,
  importFromFile
}; 