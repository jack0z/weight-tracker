"use client";

import { LogOut, Sun, Moon, Share2 } from "lucide-react";
import { useState } from "react";

/**
 * Header component with user info and controls
 */
function Header({ 
  currentUser,
  theme,
  colors,
  isSharingInProgress,
  toggleTheme,
  handleUserLogout,
  handleShare
}) {
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3`}>
      <div className="flex items-center">
        <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold ${colors.text}`}>
          Weight Tracker
        </h2>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-end">
        <span className={`text-sm mr-2 ${colors.text}`}>{currentUser}</span>
        {/* Add Share Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowShareDropdown(!showShareDropdown)}
            className={`p-2 rounded-full ${colors.buttonBgSecondary}`}
            title="Share your progress"
          >
            <Share2 size={16} className="text-white" />
          </button>
          
          {showShareDropdown && (
            <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg ${colors.cardBg} z-10 border ${colors.border}`}>
              <div className="rounded-md">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleShare(false);
                      setShowShareDropdown(false);
                    }}
                    className={`block px-4 py-2 text-sm ${colors.text} w-full text-left hover:bg-opacity-20 hover:bg-gray-100`}
                    disabled={isSharingInProgress}
                  >
                    {isSharingInProgress ? 'Creating Share...' : 'Create One-time Share'}
                  </button>
                  <button
                    onClick={() => {
                      handleShare(true);
                      setShowShareDropdown(false);
                    }}
                    className={`block px-4 py-2 text-sm ${colors.text} w-full text-left hover:bg-opacity-20 hover:bg-gray-100`}
                    disabled={isSharingInProgress}
                  >
                    {isSharingInProgress ? 'Creating Share...' : 'Create Permalink (overrides previous)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${colors.buttonBgSecondary}`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-white" />
          ) : (
            <Moon size={16} className="text-white" />
          )}
        </button>
        <button 
          onClick={handleUserLogout} 
          className={`p-2 rounded-full ${colors.buttonBgDanger}`}
          title="Log Out"
        >
          <LogOut size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default Header; 