import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Download, AlertTriangle } from 'lucide-react';

// Progressive Enhancement Hook
export const useProgressiveEnhancement = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isJavaScriptEnabled, setIsJavaScriptEnabled] = useState(false);
  const [supportsIntersectionObserver, setSupportsIntersectionObserver] = useState(false);
  const [supportsLocalStorage, setSupportsLocalStorage] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // JavaScript is enabled if this runs
    setIsJavaScriptEnabled(true);

    // Check for Intersection Observer support
    setSupportsIntersectionObserver('IntersectionObserver' in window);

    // Check for localStorage support
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      setSupportsLocalStorage(true);
    } catch {
      setSupportsLocalStorage(false);
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection type detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isJavaScriptEnabled,
    supportsIntersectionObserver,
    supportsLocalStorage,
    connectionType,
    isSlowConnection: ['slow-2g', '2g'].includes(connectionType),
    isFastConnection: ['4g'].includes(connectionType)
  };
};

// Offline Indicator Component
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useProgressiveEnhancement();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      const timer = setTimeout(() => setShowOfflineMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineMessage) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
        <span className="font-medium">
          {isOnline ? 'Back online!' : 'You\'re offline'}
        </span>
      </div>
      {!isOnline && (
        <p className="text-sm mt-1">
          Some features may be limited. We'll sync your data when you're back online.
        </p>
      )}
    </div>
  );
};

// Feature Detection Component
export const FeatureDetection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const capabilities = useProgressiveEnhancement();

  return (
    <div>
      {/* Fallback for no JavaScript */}
      <noscript>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>JavaScript is disabled.</strong> Some features may not work as expected.
          Please enable JavaScript for the best experience.
        </div>
      </noscript>

      {/* Main content with progressive enhancement */}
      <div data-capabilities={JSON.stringify(capabilities)}>
        {children}
      </div>

    </div>
  );
};

// Accessible Skip Links Component
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to navigation
      </a>
    </div>
  );
};