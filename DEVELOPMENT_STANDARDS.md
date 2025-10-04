# 🏥 EaseHealth Development Standards

## 📋 **New Page Creation Checklist**

### **1. File Structure Standards**
- [ ] Create page in `src/pages/` directory
- [ ] Use PascalCase naming (e.g., `NewFeaturePage.tsx`)
- [ ] Export as default component
- [ ] Use TypeScript with proper interfaces

### **2. Required Imports & Hooks**
```typescript
// ALWAYS include these imports
import React, { Suspense } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../translations';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import { SkipLinks, OfflineIndicator } from '../components/ProgressiveEnhancement';
import { AccessibilityAnnouncer } from '../components/AccessibilityAnnouncer';
```

### **3. Page Template Structure**
```typescript
const YourNewPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const { language } = useLanguage();
  const { t } = useTranslations(language);
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F6F6F6] dark:bg-gray-900 text-[#0A2647] dark:text-gray-100 transition-colors duration-300">
      {/* Skip Links */}
      <SkipLinks />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Navigation */}
      <Navigation user={user} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('yourPage.title')}</h1>
        {/* Your page content */}
      </main>
    </div>
  );
};

export default YourNewPage;
```

### **4. Translation Requirements**
- [ ] Add content to `src/translations/en.ts`
- [ ] Add content to `src/translations/hi.ts`
- [ ] Use nested structure: `yourPage: { title: "...", description: "..." }`
- [ ] NEVER hardcode text - always use `t('key')`

### **5. Styling Standards**
- [ ] Use CSS variables: `var(--color-primary)`, `var(--color-background)`
- [ ] Apply dark mode classes: `dark:bg-gray-900`, `dark:text-white`
- [ ] Use theme utility classes: `bg-theme-primary`, `text-theme-primary`
- [ ] Ensure responsive design with Tailwind breakpoints

### **6. Accessibility Requirements**
- [ ] Include SkipLinks component
- [ ] Include OfflineIndicator component
- [ ] Use proper ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Test with screen readers

### **7. Routing Integration**
- [ ] Add lazy import in `src/App.tsx`
- [ ] Add route in `<Routes>` component
- [ ] Add authentication guards if needed

## 🎨 **Design System Standards**

### **Color Palette**
- **Primary**: `#0075A2` (Light) / `#0EA5E9` (Dark)
- **Background**: `#FFFFFF` (Light) / `#0F172A` (Dark)
- **Text**: `#0A2647` (Light) / `#F8FAFC` (Dark)
- **Accent**: `#00D4AA` (Light) / `#06D6A0` (Dark)

### **CSS Variables Usage**
```css
/* Use these variables for consistent theming */
var(--color-primary)
var(--color-background)
var(--color-text-primary)
var(--color-border)
var(--shadow-md)
```

### **Theme Classes**
```css
/* Always include dark mode variants */
bg-[#F6F6F6] dark:bg-gray-900
text-[#0A2647] dark:text-gray-100
border-gray-200 dark:border-gray-700
```

## 🌐 **Internationalization Standards**

### **Translation Structure**
```typescript
// In en.ts and hi.ts
export const en = {
  yourPage: {
    title: "Your Page Title",
    description: "Your page description",
    sections: {
      section1: {
        title: "Section 1",
        content: "Section content"
      }
    }
  }
};
```

### **Usage in Components**
```typescript
// Always use the translation hook
const { t } = useTranslations(language);
return <h1>{t('yourPage.title')}</h1>;
```

## ♿ **Accessibility Standards**

### **Required Components**
- SkipLinks for keyboard navigation
- OfflineIndicator for connectivity status
- AccessibilityAnnouncer for screen readers
- Proper focus management

### **ARIA Labels**
```typescript
// Always include ARIA labels
<button aria-label={t('button.ariaLabel')}>
<nav aria-label={t('nav.ariaLabel')}>
```

## 🔧 **Technical Standards**

### **Performance**
- Use `React.lazy()` for code splitting
- Implement proper loading states
- Optimize images and assets

### **TypeScript**
- Define proper interfaces for props
- Use strict typing
- Avoid `any` types

### **Error Handling**
- Implement error boundaries
- Provide fallback UI
- Handle loading states

## 📱 **Responsive Design**

### **Breakpoints**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### **Mobile-First Approach**
```css
/* Start with mobile styles */
.class { /* mobile styles */ }

/* Then add larger breakpoints */
@media (min-width: 768px) { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
```

## 🚀 **Deployment Checklist**

- [ ] Test in both light and dark modes
- [ ] Test in both English and Hindi
- [ ] Test keyboard navigation
- [ ] Test responsive design
- [ ] Test accessibility with screen reader
- [ ] Verify all translations are present
- [ ] Check for console errors
- [ ] Test authentication flow (if applicable)

## 📞 **Support & Resources**

- **Design System**: `src/index.css`
- **Theme Hook**: `src/hooks/useDarkMode.ts`
- **Language Hook**: `src/contexts/LanguageContext.tsx`
- **Translations**: `src/translations/`
- **Components**: `src/components/`

---

**Remember**: Consistency is key! Follow these standards for every new page to maintain a cohesive user experience.
