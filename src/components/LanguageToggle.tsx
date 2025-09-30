import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';

interface LanguageToggleProps {
  className?: string;
  showDropdown?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '', 
  showDropdown = false 
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const { t } = useTranslations(language);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const languageOptions = [
    { value: 'en' as Language, label: t('language.english') },
    { value: 'hi' as Language, label: t('language.hindi') }
  ];

  const handleLanguageSelect = (newLanguage: Language) => {
    setLanguage(newLanguage);
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
          aria-label={`${t('language.currentLanguage')}: ${languageOptions.find(opt => opt.value === language)?.label}. Click to change language`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <Globe className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          <ChevronDown className={`w-4 h-4 text-gray-700 dark:text-gray-300 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleLanguageSelect(option.value)}
                onKeyDown={(e) => handleKeyDown(e, () => handleLanguageSelect(option.value))}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                  language === option.value 
                    ? 'bg-[#0075A2] text-white hover:bg-[#0075A2] dark:hover:bg-[#0075A2]' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                aria-label={`Switch to ${option.label}`}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      onKeyDown={(e) => handleKeyDown(e, () => setIsDropdownOpen(!isDropdownOpen))}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0075A2] focus:ring-offset-2 dark:focus:ring-offset-gray-900 transform hover:scale-105 ${className}`}
      aria-label={`${t('language.currentLanguage')}: ${languageOptions.find(opt => opt.value === language)?.label}. Click to change language`}
      aria-expanded={isDropdownOpen}
      aria-haspopup="true"
    >
      <div className="flex items-center">
        <Globe className="w-4 h-4 text-gray-700 dark:text-gray-300" />
      </div>
      {isDropdownOpen && (
        <div className="absolute mt-2 right-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLanguageSelect(option.value)}
              onKeyDown={(e) => handleKeyDown(e, () => handleLanguageSelect(option.value))}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                language === option.value 
                  ? 'bg-[#0075A2] text-white hover:bg-[#0075A2] dark:hover:bg-[#0075A2]' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              aria-label={`Switch to ${option.label}`}
            >
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </button>
  );
};

export default LanguageToggle;
