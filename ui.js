// ui.js - UI-related functionality for weight tracker

/**
 * Get trend icon based on weight change value
 * @param {number} value - Weight change value
 * @returns {string} - HTML for trend icon
 */
function getTrendIcon(value) {
  if (!value || value === 0) {
    return '<span class="trend-icon trend-neutral">−</span>';
  }
  return value < 0 
    ? '<span class="trend-icon trend-down">↓</span>' 
    : '<span class="trend-icon trend-up">↑</span>';
}

/**
 * Get color class based on positive/negative value
 * @param {number} value - The value to evaluate
 * @param {boolean} invert - Invert the colors (for weight loss being positive)
 * @returns {string} - CSS class name
 */
function getValueColorClass(value, invert = false) {
  if (!value || value === 0) return 'text-neutral';
  
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  if (invert) {
    return isNegative ? 'text-positive' : isPositive ? 'text-negative' : 'text-neutral';
  } else {
    return isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-neutral';
  }
}

/**
 * Create table HTML from weight entries
 * @param {Array} entries - Formatted weight entries
 * @returns {string} - HTML for table
 */
function createEntriesTable(entries) {
  if (!entries || entries.length === 0) {
    return '<div class="empty-state">No entries yet. Add your first weight using the form.</div>';
  }
  
  let tableHtml = `
    <table class="weight-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Weight (kg)</th>
          <th>Change</th>
          <th class="text-right">Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  entries.forEach((entry, index) => {
    const prevEntry = entries[index + 1];
    const change = prevEntry ? (entry.weight - prevEntry.weight).toFixed(1) : "--";
    const changeClass = change !== "--" 
      ? getValueColorClass(parseFloat(change), true) 
      : "";
    
    tableHtml += `
      <tr data-id="${entry.id}">
        <td>${entry.dateFormatted}</td>
        <td class="text-muted">${entry.dayFormatted}</td>
        <td class="font-medium">${entry.weight}</td>
        <td class="${changeClass}">
          ${change !== "--" 
            ? `${change > 0 ? "+" + change : change} ${getTrendIcon(parseFloat(change))}` 
            : "--"}
        </td>
        <td class="text-right">
          <button class="delete-btn" data-id="${entry.id}" title="Delete entry">
            <span class="delete-icon">×</span>
          </button>
        </td>
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  return tableHtml;
}

/**
 * Create summary cards HTML
 * @param {Object} data - Data for summary cards 
 * @returns {string} - HTML for summary cards
 */
function createSummaryCards(data) {
  const { entries, startWeight, goalWeight } = data;
  
  if (!entries || entries.length === 0) {
    return '';
  }
  
  let html = '<div class="summary-cards">';
  
  // Current weight card
  html += `
    <div class="summary-card">
      <div class="card-label">Current</div>
      <div class="card-value">${entries[0].weight} kg</div>
    </div>
  `;
  
  // Goal weight card (if set)
  if (goalWeight) {
    html += `
      <div class="summary-card">
        <div class="card-label">Goal</div>
        <div class="card-value">${goalWeight} kg</div>
      </div>
    `;
  }
  
  // Total change card (if start weight set)
  if (startWeight && entries.length > 0) {
    const totalChange = (entries[0].weight - startWeight).toFixed(1);
    const totalChangeClass = getValueColorClass(totalChange, true);
    
    html += `
      <div class="summary-card">
        <div class="card-label">Total Change</div>
        <div class="card-value ${totalChangeClass}">
          ${totalChange} kg ${getTrendIcon(totalChange)}
        </div>
      </div>
    `;
  }
  
  // Last change card (if multiple entries)
  if (entries.length > 1) {
    const lastChange = (entries[0].weight - entries[1].weight).toFixed(1);
    const lastChangeClass = getValueColorClass(lastChange, true);
    
    html += `
      <div class="summary-card">
        <div class="card-label">Last Change</div>
        <div class="card-value ${lastChangeClass}">
          ${lastChange} kg ${getTrendIcon(lastChange)}
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Create averages table HTML
 * @param {Object} data - Data for averages table
 * @returns {string} - HTML for averages table
 */
function createAveragesTable(data) {
  const { sevenDayAvg, fourteenDayAvg, thirtyDayAvg } = data;
  
  // Check if we have any data to show
  if (!sevenDayAvg.hasData && !fourteenDayAvg.hasData && !thirtyDayAvg.hasData) {
    return '<div class="empty-state">Need more data points for averages. Add entries over time to see trends.</div>';
  }
  
  let tableHtml = `
    <table class="averages-table">
      <thead>
        <tr>
          <th>Period</th>
          <th>Range</th>
          <th>Starting</th>
          <th>Current</th>
          <th>Change</th>
          <th>Daily Avg</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  // 7-day row
  if (sevenDayAvg.hasData) {
    const valueClass = getValueColorClass(sevenDayAvg.totalChange, true);
    tableHtml += `
      <tr>
        <td class="font-medium">7 Days</td>
        <td>${sevenDayAvg.startDate} - ${sevenDayAvg.endDate}</td>
        <td>${sevenDayAvg.startWeight} kg</td>
        <td>${sevenDayAvg.endWeight} kg</td>
        <td class="${valueClass}">
          ${sevenDayAvg.totalChange > 0 ? "+" : ""}${sevenDayAvg.totalChange} kg
        </td>
        <td>
          ${sevenDayAvg.value > 0 ? "+" : ""}${sevenDayAvg.value} kg/day
        </td>
        <td>${getTrendIcon(parseFloat(sevenDayAvg.value))}</td>
      </tr>
    `;
  }
  
  // 14-day row
  if (fourteenDayAvg.hasData) {
    const valueClass = getValueColorClass(fourteenDayAvg.totalChange, true);
    tableHtml += `
      <tr>
        <td class="font-medium">14 Days</td>
        <td>${fourteenDayAvg.startDate} - ${fourteenDayAvg.endDate}</td>
        <td>${fourteenDayAvg.startWeight} kg</td>
        <td>${fourteenDayAvg.endWeight} kg</td>
        <td class="${valueClass}">
          ${fourteenDayAvg.totalChange > 0 ? "+" : ""}${fourteenDayAvg.totalChange} kg
        </td>
        <td>
          ${fourteenDayAvg.value > 0 ? "+" : ""}${fourteenDayAvg.value} kg/day
        </td>
        <td>${getTrendIcon(parseFloat(fourteenDayAvg.value))}</td>
      </tr>
    `;
  }
  
  // 30-day row
  if (thirtyDayAvg.hasData) {
    const valueClass = getValueColorClass(thirtyDayAvg.totalChange, true);
    tableHtml += `
      <tr>
        <td class="font-medium">30 Days</td>
        <td>${thirtyDayAvg.startDate} - ${thirtyDayAvg.endDate}</td>
        <td>${thirtyDayAvg.startWeight} kg</td>
        <td>${thirtyDayAvg.endWeight} kg</td>
        <td class="${valueClass}">
          ${thirtyDayAvg.totalChange > 0 ? "+" : ""}${thirtyDayAvg.totalChange} kg
        </td>
        <td>
          ${thirtyDayAvg.value > 0 ? "+" : ""}${thirtyDayAvg.value} kg/day
        </td>
        <td>${getTrendIcon(parseFloat(thirtyDayAvg.value))}</td>
      </tr>
    `;
  }
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  return tableHtml;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info')
 */
function showToast(message, type = 'info') {
  // Implementation depends on your toast library
  // This is a simple fallback
  if (typeof toast !== 'undefined') {
    toast[type](message);
  } else {
    alert(message);
  }
}

// Export functions
export {
  getTrendIcon,
  getValueColorClass,
  createEntriesTable,
  createSummaryCards,
  createAveragesTable,
  showToast
}; 