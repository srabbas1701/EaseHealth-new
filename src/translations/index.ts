import React from 'react';
import { en } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';


export const translations = {
  en,
  hi
};

export type TranslationKeys = typeof en;

// Helper function to get nested object value
const getNestedValue = (obj: any, path: string): any => {
  if (!obj) {
    return undefined;
  }

  try {
    return path.split('.').reduce((current, key) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      return current[key];
    }, obj);
  } catch (error) {
    return undefined;
  }
};

// Helper function to get translation
const getTranslation = (language: Language, key: string): string => {
  if (!key) {
    return '';
  }

  try {
    // First try to get the value in the current language
    const currentLangTranslations = translations[language];
    if (!currentLangTranslations) {
      return key;
    }

    const value = getNestedValue(currentLangTranslations, key);
    if (value !== undefined && value !== null) {
      return value;
    }

    // If not found and language is not English, try English
    if (language !== 'en') {
      const englishValue = getNestedValue(translations.en, key);
      if (englishValue !== undefined && englishValue !== null) {
        return englishValue;
      }
    }

    // If still not found, return the key
    return key;
  } catch (error) {
    return key;
  }
};

// Hook for using translations
export const useTranslations = (language: Language) => {
  // Force re-render when language changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    console.log('🔄 useTranslations: Language changed to', language);
    forceUpdate();
  }, [language]);

  // Memoize the translation function
  const t = React.useCallback((key: string): string => {
    if (!key) {
      return '';
    }

    const value = getTranslation(language, key);
    if (value === key) {
      console.warn('⚠️ Translation missing for key:', key, 'in language:', language);
    }
    // Removed verbose translation logging to reduce console noise
    return value;
  }, [language]);

  return {
    t,
    translations: translations[language]
  };
};