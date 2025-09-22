import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface DarkModeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  showDropdown = false 
}) => {
  const { isDarkMode, toggleDarkMode, setTheme } = useDarkMode();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) return 'system';
    return savedTheme as 'light' | 'dark' | 'system';
  };

  const currentTheme = getCurrentTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const handleThemeSelect = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  if (showDropdown) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onKeyDown={(e) => handleKeyDown(e, () => setIsDropdownOpen(!isDropdownOpen))}
          className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={`Current theme: ${currentTheme}. Click to change theme`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {currentTheme === 'light' && <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
          {currentTheme === 'dark' && <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
          {currentTheme === 'system' && <Monitor className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
          <ChevronDown className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeSelect(option.value as 'light' | 'dark' | 'system')}
                  onKeyDown={(e) => handleKeyDown(e, () => handleThemeSelect(option.value as 'light' | 'dark' | 'system'))}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                    currentTheme === option.value 
                      ? 'bg-[#0075A2] text-white hover:bg-[#0075A2] dark:hover:bg-[#0075A2]' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  aria-label={`Switch to ${option.label.toLowerCase()} theme`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      onKeyDown={(e) => handleKeyDown(e, toggleDarkMode)}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 dark:focus:ring-offset-gray-900 transform hover:scale-105 ${className}`}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 transition-transform duration-200" />
      )}
    </button>
  );
};

export default DarkModeToggle;