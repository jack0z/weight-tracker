// core.js - Main application logic for weight tracker

// Import modules
import * as Data from './data.js';
import * as Stats from './stats.js';
import * as Chart from './chart.js';
import * as Export from './export.js';
import * as UI from './ui.js';

// Global variables
let entries = [];
let formattedEntries = [];
let startWeight = "";
let goalWeight = "";
let height = "";
let myChart = null;

// Initialize the weight tracker
function initWeightTracker() {
  // Load data
  loadAllData();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initial UI update
  updateUI();
}

// Load all data from localStorage
function loadAllData() {
  entries = Data.loadEntries();
  formattedEntries = Data.formatEntries(entries);
  
  const settings = Data.loadSettings();
  startWeight = settings.startWeight;
  goalWeight = settings.goalWeight;
  height = settings.height;
  
  // Set current date in form
  document.getElementById('date').valueAsDate = new Date();
  
  // Set values from settings
  if (startWeight) {
    document.getElementById('start-weight').value = startWeight;
  }
  
  if (goalWeight) {
    document.getElementById('goal-weight').value = goalWeight;
  }
  
  if (height) {
    document.getElementById('height').value = height;
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Add new entry form
  document.getElementById('add-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addEntry();
  });
  
  // Set start weight
  document.getElementById('set-start').addEventListener('click', function() {
    setStartWeight();
  });
  
  // Set goal weight
  document.getElementById('set-goal').addEventListener('click', function() {
    setGoalWeight();
  });
  
  // Set height
  document.getElementById('set-height').addEventListener('click', function() {
    setHeight();
  });
  
  // Delete entry (using event delegation)
  document.getElementById('history-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn') || e.target.classList.contains('delete-icon')) {
      const id = parseInt(e.target.closest('[data-id]').dataset.id);
      deleteEntry(id);
    }
  });
  
  // Export data
  document.getElementById('export-btn').addEventListener('click', function() {
    exportData();
  });
  
  // Import data
  document.getElementById('import-file').addEventListener('change', function(e) {
    importData(e);
  });
}

// Add a new weight entry
function addEntry() {
  const weightInput = document.getElementById('weight');
  const dateInput = document.getElementById('date');
  
  const weight = parseFloat(weightInput.value);
  const date = dateInput.value;
  
  if (isNaN(weight) || weight <= 0) {
    UI.showToast('Please enter a valid weight', 'error');
    return;
  }
  
  if (!date) {
    UI.showToast('Please enter a date', 'error');
    return;
  }
  
  // Add entry
  entries = Data.addEntry(date, weight, entries);
  formattedEntries = Data.formatEntries(entries);
  
  // Clear form
  weightInput.value = '';
  
  // Update UI
  updateUI();
  
  // Show success message
  UI.showToast('Weight entry added', 'success');
}

// Set start weight
function setStartWeight() {
  const input = document.getElementById('start-weight');
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value <= 0) {
    UI.showToast('Please enter a valid start weight', 'error');
    return;
  }
  
  startWeight = value;
  Data.saveSetting('start-weight', value);
  updateUI();
  
  UI.showToast('Start weight saved', 'success');
}

// Set goal weight
function setGoalWeight() {
  const input = document.getElementById('goal-weight');
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value <= 0) {
    UI.showToast('Please enter a valid goal weight', 'error');
    return;
  }
  
  goalWeight = value;
  Data.saveSetting('goal-weight', value);
  updateUI();
  
  UI.showToast('Goal weight saved', 'success');
}

// Set height
function setHeight() {
  const input = document.getElementById('height');
  const value = parseFloat(input.value);
  
  if (isNaN(value) || value <= 0) {
    UI.showToast('Please enter a valid height', 'error');
    return;
  }
  
  height = value;
  Data.saveSetting('height', value);
  updateUI();
  
  UI.showToast('Height saved', 'success');
}

// Delete a weight entry
function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    entries = Data.deleteEntry(id, entries);
    formattedEntries = Data.formatEntries(entries);
    updateUI();
    UI.showToast('Entry deleted', 'success');
  }
}

// Export data to CSV
function exportData() {
  if (entries.length === 0) {
    UI.showToast('No data to export', 'error');
    return;
  }
  
  const success = Export.exportToCsv(entries);
  
  if (success) {
    UI.showToast('Data exported successfully', 'success');
  } else {
    UI.showToast('Error exporting data', 'error');
  }
}

// Import data from file
async function importData(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  try {
    // Show loading message
    UI.showToast('Importing data...', 'info');
    
    // Parse file
    const importedEntries = await Export.importFromFile(file);
    
    if (importedEntries.length === 0) {
      UI.showToast('No valid entries found in the file', 'error');
      return;
    }
    
    // Merge with existing entries, avoiding duplicates
    const existingDates = entries.map(e => new Date(e.date).toISOString().split('T')[0]);
    
    let newEntries = [];
    let duplicates = 0;
    
    importedEntries.forEach(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      
      if (!existingDates.includes(entryDate)) {
        newEntries.push(entry);
      } else {
        duplicates++;
      }
    });
    
    if (newEntries.length === 0) {
      UI.showToast(`No new entries to import (${duplicates} duplicates found)`, 'info');
      return;
    }
    
    // Add new entries
    entries = [...entries, ...newEntries];
    Data.saveEntries(entries);
    formattedEntries = Data.formatEntries(entries);
    
    // Update UI
    updateUI();
    
    // Show success message
    UI.showToast(`Imported ${newEntries.length} entries (${duplicates} duplicates skipped)`, 'success');
    
  } catch (error) {
    console.error('Import error:', error);
    UI.showToast('Error importing data: ' + error.message, 'error');
  }
  
  // Reset file input
  event.target.value = '';
}

// Update UI with current data
function updateUI() {
  // Update weight history table
  updateHistoryTable();
  
  // Update chart
  updateChart();
  
  // Update summary cards
  updateSummaryCards();
  
  // Update averages table
  updateAveragesTable();
  
  // Update BMI display
  updateBMI();
  
  // Enable/disable export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.disabled = entries.length === 0;
  }
}

// Update weight history table
function updateHistoryTable() {
  const container = document.getElementById('history-container');
  if (!container) return;
  
  container.innerHTML = UI.createEntriesTable(formattedEntries);
}

// Update weight chart
function updateChart() {
  const chartContainer = document.getElementById('chart-container');
  if (!chartContainer) return;
  
  if (entries.length === 0) {
    chartContainer.innerHTML = '<div class="empty-state">No data available yet.</div>';
    return;
  }
  
  // Get chart configuration
  const chartConfig = Chart.generateChartConfig(
    entries, 
    startWeight, 
    goalWeight, 
    document.body.classList.contains('dark-theme') ? 'dark' : 'light'
  );
  
  // Create or update chart
  if (typeof ApexCharts !== 'undefined') {
    if (myChart) {
      myChart.updateOptions(chartConfig.options);
      myChart.updateSeries(chartConfig.series);
    } else {
      myChart = new ApexCharts(chartContainer, chartConfig.options);
      myChart.render();
    }
  } else {
    // Fallback if ApexCharts is not available
    chartContainer.innerHTML = `
      <div class="chart-fallback">
        <p>Chart library not loaded.</p>
        <p>Latest weight: ${entries[0].weight} kg</p>
      </div>
    `;
  }
}

// Update summary cards
function updateSummaryCards() {
  const container = document.getElementById('summary-container');
  if (!container) return;
  
  container.innerHTML = UI.createSummaryCards({
    entries: formattedEntries,
    startWeight,
    goalWeight
  });
}

// Update averages table
function updateAveragesTable() {
  const container = document.getElementById('averages-container');
  if (!container) return;
  
  // Calculate averages
  const sevenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 7);
  const fourteenDayAvg = Stats.calculatePeriodAverage(formattedEntries, 14);
  const thirtyDayAvg = Stats.calculatePeriodAverage(formattedEntries, 30);
  
  container.innerHTML = UI.createAveragesTable({
    sevenDayAvg,
    fourteenDayAvg,
    thirtyDayAvg
  });
}

// Update BMI display
function updateBMI() {
  const container = document.getElementById('bmi-container');
  if (!container) return;
  
  if (!height || entries.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const currentWeight = entries[0].weight;
  const bmi = Stats.calculateBMI(currentWeight, height);
  const bmiCategory = Stats.getBMICategory(bmi);
  
  container.innerHTML = `
    <div class="bmi-card">
      <div class="card-label">BMI</div>
      <div class="card-value">${bmi}</div>
      <div class="bmi-category ${bmiCategory.color}">${bmiCategory.category}</div>
    </div>
  `;
}

// Toggle between dark and light theme
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  const isDarkTheme = document.body.classList.contains('dark-theme');
  localStorage.setItem('dark-theme', isDarkTheme);
  
  // Update chart colors
  updateChart();
}

// Apply saved theme
function applyTheme() {
  const isDarkTheme = localStorage.getItem('dark-theme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Apply saved theme
  applyTheme();
  
  // Set up theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Initialize the app
  initWeightTracker();
});

// Export functions
export {
  initWeightTracker,
  loadAllData,
  updateUI,
  toggleTheme
};