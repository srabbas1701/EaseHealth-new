import React from 'react';
import { en } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';

export const translations = {
  en,
  hi
};

export type TranslationKeys = typeof en;

// Helper function to get translation
export const getTranslation = (language: Language, key: string): string => {
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return the key itself if not found
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
};

// Helper function to get nested object value
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Hook for using translations
export const useTranslations = (language: Language) => {
  // Force re-render when language changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    forceUpdate();
  }, [language]);
  
  return {
    t: (key: string) => {
      const value = getNestedValue(translations[language], key);
      if (value !== undefined) {
        return value;
      }
      // Fallback to English
      const fallbackValue = getNestedValue(translations.en, key);
      return fallbackValue !== undefined ? fallbackValue : key;
    },
    translations: translations[language]
  };
};
