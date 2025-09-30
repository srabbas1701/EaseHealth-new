import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
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
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    
    // Update document language attribute for accessibility
    document.documentElement.lang = language;
    
    // Update document direction for RTL languages (if needed in future)
    if (language === 'hi') {
      document.documentElement.dir = 'ltr'; // Hindi uses LTR even though it's Devanagari script
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    console.log('🌐 Language context updated to:', language);
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    console.log('🔄 Language changing from', language, 'to', newLanguage);
    setLanguageState(newLanguage);
    // Force a small delay to ensure state update
    setTimeout(() => {
      console.log('✅ Language state updated to:', newLanguage);
    }, 0);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'en' ? 'hi' : 'en');
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    isEnglish: language === 'en',
    isHindi: language === 'hi'
  };

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
