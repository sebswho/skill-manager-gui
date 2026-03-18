import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Translations, I18nContextType } from './types';

// Import translation files
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const translations: Record<Locale, Translations> = {
  'zh-CN': zhCN,
  'en': en,
};

export const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = 'zh-CN' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isLoading, setIsLoading] = useState(false);

  // Get nested value from object using dot notation
  const getNestedValue = useCallback((obj: Translations, key: string): string => {
    const keys = key.split('.');
    let value: unknown = obj;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, []);

  // Translate function with parameter substitution
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[locale], key);
    
    if (!params) {
      return translation;
    }
    
    // Replace {param} with actual values
    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
    }, translation);
  }, [locale, getNestedValue]);

  // Set locale with loading state
  const setLocale = useCallback((newLocale: Locale) => {
    setIsLoading(true);
    setLocaleState(newLocale);
    // Simulate loading for smooth transition
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  // Update locale when initialLocale changes
  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const value: I18nContextType = {
    t,
    locale,
    setLocale,
    isLoading,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
