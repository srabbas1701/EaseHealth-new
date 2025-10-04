# 🚀 EaseHealth Quick Reference

## New Page Setup (5 Steps)

### 1. Create Page File
```typescript
// src/pages/YourPage.tsx
import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import { SkipLinks, OfflineIndicator } from '../components/ProgressiveEnhancement';

const YourPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      <SkipLinks />
      <OfflineIndicator />
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('yourPage.title')}</h1>
        {/* Content */}
      </main>
    </div>
  );
};

export default YourPage;
```

### 2. Add Translations
```typescript
// src/translations/en.ts
yourPage: {
  title: "Your Page Title",
  description: "Description"
}

// src/translations/hi.ts
yourPage: {
  title: "आपका पेज शीर्षक",
  description: "विवरण"
}
```

### 3. Add Route
```typescript
// src/App.tsx
const YourPage = React.lazy(() => import('./pages/YourPage'));

// In Routes
<Route path="/your-page" element={<YourPage />} />
```

### 4. Style Standards
- Use: `var(--color-primary)`, `dark:bg-gray-900`, `bg-theme-primary`
- Never: Hardcode colors, forget dark mode, skip responsive design

### 5. Test Checklist
- [ ] Light/Dark mode
- [ ] English/Hindi
- [ ] Keyboard navigation
- [ ] Mobile responsive
- [ ] Screen reader

## Key Files to Reference
- `src/index.css` - Colors, themes, utilities
- `src/hooks/useDarkMode.ts` - Theme logic
- `src/contexts/LanguageContext.tsx` - Language logic
- `src/translations/` - All text content
- `src/components/` - Reusable components
