import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import de from '../locales/de.json';

type Language = 'en' | 'de';

const translationDictionaries: Record<Language, any> = { en, de };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('taskbuddy_lang') as Language) || 'en'; // Default to English (en)
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('taskbuddy_lang', lang);
    // Trigger window event so formatters can re-evaluate active locales
    window.dispatchEvent(new Event('app_language_change'));
  };

  useEffect(() => {
    const handleLangChange = () => {
      const stored = (localStorage.getItem('taskbuddy_lang') as Language) || 'en';
      if (stored !== language) {
        setLanguageState(stored);
      }
    };
    window.addEventListener('app_language_change', handleLangChange);
    return () => window.removeEventListener('app_language_change', handleLangChange);
  }, [language]);

  const t = (path: string): string => {
    const dictionary = translationDictionaries[language] || en;
    const parts = path.split('.');
    let current = dictionary;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') {
        return path;
      }
      current = current[part];
    }
    return typeof current === 'string' ? current : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
