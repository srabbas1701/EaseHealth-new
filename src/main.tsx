import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { translations } from './translations';

// Initialize translations
const savedLanguage = localStorage.getItem('language') || 'en';
const initialLanguage = savedLanguage === 'hi' ? 'hi' : 'en';

// Preload translations
const preloadTranslations = () => {
  try {
    // Force load both language files
    Object.keys(translations).forEach(lang => {
      const langData = translations[lang as 'en' | 'hi'];
      if (!langData) {
        console.error(`❌ Failed to load translations for ${lang}`);
      }
    });
    console.log('✅ Translations preloaded successfully');
  } catch (error) {
    console.error('❌ Error preloading translations:', error);
  }
};

// Initialize translations before rendering
preloadTranslations();

console.log('🚀 main.tsx is loading...');
console.log('Root element:', document.getElementById('root'));
console.log('Initial language:', initialLanguage);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);