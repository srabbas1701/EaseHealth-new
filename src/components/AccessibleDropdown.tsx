import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface DropdownOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface AccessibleDropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  maxHeight?: string;
}

const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  multiple = false,
  searchable = false,
  disabled = false,
  error,
  label,
  required = false,
  className = '',
  maxHeight = 'max-h-60'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected options
  const selectedOptions = multiple
    ? options.filter(option => Array.isArray(value) && value.includes(option.value))
    : options.find(option => option.value === value);

  // Handle option selection
  const handleOptionSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      
      onChange(newValues);
      setAnnouncement(`${option.label} ${currentValues.includes(option.value) ? 'removed' : 'selected'}`);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
      setAnnouncement(`${option.label} selected`);
      triggerRef.current?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(filteredOptions.length - 1);
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
        break;
    }
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Generate display text
  const getDisplayText = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option?.label || placeholder;
      }
      return `${value.length} items selected`;
    }
    
    if (selectedOptions && !Array.isArray(selectedOptions)) {
      return selectedOptions.label;
    }
    
    return placeholder;
  };

  // Remove selected item (for multiple selection)
  const removeSelectedItem = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (Array.isArray(value)) {
      const newValues = value.filter(v => v !== optionValue);
      onChange(newValues);
      const option = options.find(opt => opt.value === optionValue);
      setAnnouncement(`${option?.label} removed`);
    }
  };

  const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  const listboxId = `listbox-${dropdownId}`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Label */}
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={dropdownId}
        type="button"
        className={`relative w-full bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${dropdownId}-label` : undefined}
        aria-describedby={error ? `${dropdownId}-error` : undefined}
        aria-controls={listboxId}
        aria-required={required}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-wrap gap-1">
            {multiple && Array.isArray(value) && value.length > 0 ? (
              value.slice(0, 3).map(val => {
                const option = options.find(opt => opt.value === val);
                return option ? (
                  <span
                    key={val}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {option.label}
                    <button
                      type="button"
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:bg-blue-200 dark:focus:bg-blue-800"
                      onClick={(e) => removeSelectedItem(val, e)}
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })
            ) : (
              <span className={`block truncate ${!selectedOptions || (Array.isArray(value) && value.length === 0) ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {getDisplayText()}
              </span>
            )}
            {multiple && Array.isArray(value) && value.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{value.length - 3} more
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={searchRef}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Search options..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                aria-label="Search options"
              />
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            className={`py-1 overflow-auto ${maxHeight}`}
            role="listbox"
            id={listboxId}
            aria-multiselectable={multiple}
            aria-label={label || 'Options'}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = multiple
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;
                const isFocused = index === focusedIndex;

                return (
                  <li
                    key={option.id}
                    className={`relative cursor-pointer select-none px-3 py-2 ${
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isFocused
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="mr-3 flex-shrink-0">{option.icon}</span>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id={`${dropdownId}-error`} className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Helper text for screen readers */}
      <div className="sr-only">
        {multiple
          ? 'This is a multi-select dropdown. Use arrow keys to navigate, Enter or Space to select/deselect options, Escape to close.'
          : 'This is a dropdown menu. Use arrow keys to navigate, Enter or Space to select, Escape to close.'}
      </div>
    </div>
  );
};

export default AccessibleDropdown;