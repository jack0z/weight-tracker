// utils/theme-utils.js - Theme-related utilities for the weight tracker app

/**
 * Get theme colors based on current theme
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {Object} - Object with color classes for different UI elements
 */
export function getThemeColors(theme = 'dark') {
  return {
    bg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    cardBg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    textMuted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    buttonBgPrimary: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    buttonBgSecondary: theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269]' : 'bg-[#939F91] hover:bg-[#8A948C]',
    buttonBgDanger: theme === 'dark' ? 'bg-[#ed4245] hover:bg-[#eb2c30]' : 'bg-[#F85552] hover:bg-[#e04b48]',
    inputBg: theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-[#E5DFC5]',
    blockBg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#E5DFC5]',
    positive: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
    negative: theme === 'dark' ? 'text-[#ed4245]' : 'text-[#F85552]',
  };
}

/**
 * Apply theme to the document
 * @param {string} theme - Current theme ('dark' or 'light')
 */
export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;
  
  // Save theme preference
  localStorage.setItem("theme", theme);
  
  // Apply theme to document
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Get saved theme from localStorage
 * @returns {string} - 'dark' or 'light'
 */
export function getSavedTheme() {
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem("theme") || 'light';
} 