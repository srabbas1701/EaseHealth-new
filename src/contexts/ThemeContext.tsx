import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const getSystemTheme = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
    return savedTheme as Theme;
  }
  return 'system';
};

const getInitialDarkMode = (theme: Theme): boolean => {
  if (typeof window === 'undefined') return false;
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return getSystemTheme();
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getInitialDarkMode(getInitialTheme()));

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const newDarkMode = mediaQuery.matches;
        setIsDarkMode(newDarkMode);
        updateDOMTheme(newDarkMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const updateDOMTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  // Update theme when it changes
  useEffect(() => {
    const newDarkMode = theme === 'dark' || (theme === 'system' && getSystemTheme());
    
    // Update localStorage
    localStorage.setItem('theme', theme);
    
    // Update isDarkMode state and DOM in sync
    setIsDarkMode(newDarkMode);
    updateDOMTheme(newDarkMode);
    
    console.log('🎨 Theme context updated:', {
      theme,
      isDarkMode: newDarkMode,
      systemDark: getSystemTheme()
    });
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    console.log('🔄 Theme changing:', {
      from: theme,
      to: newTheme,
      currentDark: isDarkMode,
      systemDark: getSystemTheme()
    });
    setThemeState(newTheme);
  };

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  };

  // Apply initial theme to DOM
  useEffect(() => {
    updateDOMTheme(isDarkMode);
  }, []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};