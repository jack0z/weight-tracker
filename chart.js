// chart.js - Chart configuration and rendering for weight tracker

/**
 * Generate chart configuration for weight data
 * @param {Array} entries - Array of weight entries
 * @param {number} startWeight - Starting weight for reference line
 * @param {number} goalWeight - Goal weight for reference line
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {Object} - Chart configuration object
 */
function generateChartConfig(entries, startWeight, goalWeight, theme = 'dark') {
  // Default colors
  const colors = {
    line: theme === 'dark' ? '#5865f2' : '#8DA101',
    gradient: {
      start: theme === 'dark' ? 'rgba(88, 101, 242, 0.7)' : 'rgba(141, 161, 1, 0.7)',
      end: theme === 'dark' ? 'rgba(88, 101, 242, 0)' : 'rgba(141, 161, 1, 0)'
    },
    goal: theme === 'dark' ? '#57f287' : '#126134',
    start: theme === 'dark' ? '#fee75c' : '#DFA000',
    grid: theme === 'dark' ? '#1e1f22' : '#DDD8BE',
    text: theme === 'dark' ? '#b5bac1' : '#829181'
  };
  
  // Format entries for the chart
  const formattedEntries = entries.map(e => ({
    date: new Date(e.date),
    weight: e.weight
  })).sort((a, b) => a.date - b.date);
  
  // Prepare annotations for goal and start weights
  const annotations = {
    yaxis: []
  };
  
  if (goalWeight) {
    annotations.yaxis.push({
      y: goalWeight,
      borderColor: colors.goal,
      borderWidth: 2,
      strokeDashArray: 5,
      label: {
        borderColor: colors.goal,
        style: {
          color: theme === 'dark' ? '#fff' : '#000',
          background: colors.goal
        },
        text: 'Goal'
      }
    });
  }
  
  if (startWeight) {
    annotations.yaxis.push({
      y: startWeight,
      borderColor: colors.start,
      borderWidth: 2,
      strokeDashArray: 5,
      label: {
        borderColor: colors.start,
        style: {
          color: '#000',
          background: colors.start
        },
        text: 'Start'
      }
    });
  }
  
  return {
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false,
        },
        background: 'transparent',
        fontFamily: 'system-ui, sans-serif',
      },
      colors: [colors.line],
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
              color: colors.gradient.start,
              opacity: 0.2
            },
            {
              offset: 100,
              color: colors.gradient.end,
              opacity: 0
            }
          ]
        }
      },
      grid: {
        show: false,  // Hide all grid lines
        borderColor: colors.grid,
        strokeDashArray: 3,
        padding: {
          left: 0,
          right: 0
        },
        xaxis: {
          lines: {
            show: false // Remove vertical grid lines
          }
        },
        yaxis: {
          lines: {
            show: false // Remove horizontal grid lines
          }
        }
      },
      annotations: annotations,
      xaxis: {
        type: 'datetime',
        categories: formattedEntries.map(e => e.date.toISOString()),
        labels: {
          style: {
            colors: colors.text,
          },
          format: 'MMM dd',
          offsetX: 20
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
            colors: colors.text,
          },
          formatter: (value) => `${value} kg`,
          offsetX: -10
        },
      },
      tooltip: {
        theme: theme,
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
      data: formattedEntries.map(e => e.weight)
    }]
  };
}

/**
 * Generate configuration for weight distribution chart
 * @param {Array} entries - Array of weight entries
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {Object} - Chart configuration object
 */
function generateDistributionChartConfig(entries, ranges, distribution, theme = 'dark') {
  const colors = {
    bar: theme === 'dark' ? '#5865f2' : '#8DA101',
    grid: theme === 'dark' ? '#1e1f22' : '#DDD8BE',
    text: theme === 'dark' ? '#b5bac1' : '#829181'
  };
  
  return {
    options: {
      chart: {
        type: 'bar',
        height: 200,
        toolbar: {
          show: false,
        },
        background: 'transparent',
        fontFamily: 'system-ui, sans-serif',
      },
      colors: [colors.bar],
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
        borderColor: colors.grid,
        strokeDashArray: 3,
        padding: {
          left: 0,
          right: 0
        },
        xaxis: {
          lines: {
            show: false // Remove vertical grid lines
          }
        },
        yaxis: {
          lines: {
            show: false // Remove horizontal grid lines
          }
        }
      },
      xaxis: {
        categories: ranges,
        labels: {
          style: {
            colors: colors.text,
          },
          offsetX: 10
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
            color: colors.text
          }
        },
        labels: {
          style: {
            colors: colors.text,
          },
          offsetX: -10
        },
      },
      tooltip: {
        theme: theme,
        y: {
          formatter: (value) => `${value} days`
        }
      }
    },
    series: [{
      name: 'Days at Weight',
      data: distribution
    }]
  };
}

/**
 * Get chart options for weight data
 * @param {number} startWeight - Starting weight for reference line
 * @param {number} goalWeight - Goal weight for reference line
 * @returns {Object} - Chart options object
 */
export function getChartOptions(startWeight, goalWeight) {
  return {
    chart: {
      type: 'line',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 4
    },
    xaxis: {
      type: 'datetime',
      labels: {
        format: 'MMM d'
      }
    },
    yaxis: {
      title: {
        text: 'Weight (kg)'
      }
    },
    annotations: {
      yaxis: [
        {
          y: startWeight,
          borderColor: '#10B981',
          label: {
            text: 'Start Weight',
            style: {
              color: '#10B981'
            }
          }
        },
        {
          y: goalWeight,
          borderColor: '#EF4444',
          label: {
            text: 'Goal Weight',
            style: {
              color: '#EF4444'
            }
          }
        }
      ]
    }
  };
}

/**
 * Get chart series data for weight entries
 * @param {Array} entries - Array of weight entries
 * @returns {Array} - Chart series data
 */
export function getChartSeries(entries) {
  return [{
    name: 'Weight',
    data: entries.map(entry => ({
      x: new Date(entry.date).getTime(),
      y: entry.weight
    }))
  }];
}

// Export functions
export {
  generateChartConfig,
  generateDistributionChartConfig
}; 