import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';

const LanguageDebug: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslations(language);

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">🌐 Language Debug</div>
      <div>Current Language: <span className="font-mono bg-gray-700 px-1 rounded">{language}</span></div>
      <div>Test Translation: <span className="font-mono bg-gray-700 px-1 rounded">{t('nav.home')}</span></div>
      <div>Hero Title: <span className="font-mono bg-gray-700 px-1 rounded">{t('hero.title')}</span></div>
      <div className="mt-2 space-y-1">
        <button 
          onClick={() => setLanguage('en')}
          className={`w-full px-2 py-1 rounded text-xs ${language === 'en' ? 'bg-green-600' : 'bg-blue-500'}`}
        >
          🇺🇸 English
        </button>
        <button 
          onClick={() => setLanguage('hi')}
          className={`w-full px-2 py-1 rounded text-xs ${language === 'hi' ? 'bg-green-600' : 'bg-blue-500'}`}
        >
          🇮🇳 Hindi
        </button>
      </div>
    </div>
  );
};

export default LanguageDebug;
