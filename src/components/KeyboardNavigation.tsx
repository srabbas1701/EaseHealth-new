import React, { useEffect, useRef } from 'react';
import { useAnnouncer } from './AccessibilityAnnouncer';

// Focus management utilities
export const useFocusManagement = () => {
  const { announce } = useAnnouncer();

  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  };

  const focusLastElement = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  };

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        const htmlElement = element as HTMLElement;
        return htmlElement.offsetParent !== null && 
               !htmlElement.hasAttribute('aria-hidden') &&
               window.getComputedStyle(htmlElement).visibility !== 'hidden';
      }) as HTMLElement[];
  };

  const announceNavigation = (section: string) => {
    announce(`Navigated to ${section} section`);
  };

  return {
    focusFirstElement,
    focusLastElement,
    trapFocus,
    getFocusableElements,
    announceNavigation
  };
};

// Skip links component
export const SkipLinks: React.FC = () => {
  const skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#features', label: 'Skip to features' },
    { href: '#how-it-works', label: 'Skip to how it works' },
    { href: '#testimonials', label: 'Skip to testimonials' },
    { href: '#contact', label: 'Skip to contact' }
  ];

  return (
    <div className="skip-links">
      {skipLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onFocus={(e) => e.currentTarget.classList.add('skip-link-focused')}
          onBlur={(e) => e.currentTarget.classList.remove('skip-link-focused')}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Keyboard navigation hook for sections
export const useKeyboardNavigation = () => {
  const { announceNavigation } = useFocusManagement();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + number keys for quick section navigation
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const sectionMap: { [key: string]: string } = {
          '1': '#home',
          '2': '#features', 
          '3': '#how-it-works',
          '4': '#testimonials',
          '5': '#faqs',
          '6': '#contact'
        };

        const targetSection = sectionMap[event.key];
        if (targetSection) {
          event.preventDefault();
          const element = document.querySelector(targetSection) as HTMLElement;
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.focus();
            announceNavigation(element.getAttribute('aria-label') || targetSection.slice(1));
          }
        }
      }

      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.closest('[role="dialog"]')) {
          const closeButton = activeElement.closest('[role="dialog"]')?.querySelector('[aria-label*="close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [announceNavigation]);
};

// Focus visible utility component
export const FocusVisibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return <>{children}</>;
};