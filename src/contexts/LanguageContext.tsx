import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../translations';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  isEnglish: boolean;
  isHindi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Helper function to get initial language
const getInitialLanguage = (): Language => {
  try {
    // Check if user has a saved preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      return savedLanguage as Language;
    }

    // Check browser language preference
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('hi')) {
      return 'hi';
    }

    // Default to English
    return 'en';
  } catch (error) {
    console.error('Error getting initial language:', error);
    return 'en';
  }
};

// Helper function to verify translations exist
const verifyTranslations = (language: Language) => {
  try {
    const langTranslations = translations[language];
    if (!langTranslations) {
      console.error('No translations found for language:', language);
      return false;
    }

    // Check if required sections exist
    const requiredSections = ['preRegistration', 'common', 'nav'];
    const missingSections = requiredSections.filter(section => !langTranslations[section]);

    if (missingSections.length > 0) {
      console.error('Missing translation sections for', language, ':', missingSections);
      return false;
    }

    console.log('✅ Translations verified for', language, ':', Object.keys(langTranslations));
    return true;
  } catch (error) {
    console.error('Error verifying translations:', error);
    return false;
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize translations and language settings
  useEffect(() => {
    try {
      const initialLanguage = getInitialLanguage();
      console.log('🚀 Initializing language context:', {
        initialLanguage,
        availableTranslations: Object.keys(translations)
      });

      // Verify translations exist
      if (!verifyTranslations(initialLanguage)) {
        console.error('❌ Initial language verification failed, falling back to English');
        setLanguageState('en');
        setIsInitialized(true);
        return;
      }

      // Set initial language
      setLanguageState(initialLanguage);
      setIsInitialized(true);
      console.log('✅ Language context initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing language:', error);
      setLanguageState('en');
      setIsInitialized(true);
    }
  }, []);

  // Handle language changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // Verify translations exist for new language
      if (!verifyTranslations(language)) {
        return;
      }

      // Save language preference to localStorage
      localStorage.setItem('language', language);

      // Update document language attribute for accessibility
      document.documentElement.lang = language;
      document.documentElement.setAttribute('lang', language);

      // Update document direction for RTL languages (if needed in future)
      document.documentElement.dir = 'ltr'; // Both English and Hindi are LTR

      // Force re-render of components using translations
      window.dispatchEvent(new Event('languagechange'));
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [language, isInitialized]);

  const setLanguage = (newLanguage: Language) => {
    try {
      // Verify translations exist for new language
      if (!verifyTranslations(newLanguage)) {
        console.error('Cannot switch language: missing translations for', newLanguage);
        return;
      }

      // Update language state
      setLanguageState(newLanguage);
      console.log('Language changed to:', newLanguage);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'hi' : 'en';
    console.log('🔄 Toggling language from', language, 'to', newLanguage);
    setLanguage(newLanguage);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    isEnglish: language === 'en',
    isHindi: language === 'hi'
  };

  // Don't render children until translations are initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};