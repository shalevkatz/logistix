import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Language = 'en' | 'he' | 'ru';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, options?: any) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  // Load language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      // First, try to get from user profile in database
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profile?.language) {
          i18n.locale = profile.language;
          setLanguageState(profile.language as Language);

          // Set RTL for Hebrew
          if (profile.language === 'he') {
            I18nManager.forceRTL(true);
          } else {
            I18nManager.forceRTL(false);
          }

          setIsReady(true);
          return;
        }
      }

      // Fallback to AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        i18n.locale = savedLanguage;
        setLanguageState(savedLanguage as Language);

        // Set RTL for Hebrew
        if (savedLanguage === 'he') {
          I18nManager.forceRTL(true);
        } else {
          I18nManager.forceRTL(false);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setIsReady(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      // Update i18n
      i18n.locale = lang;
      setLanguageState(lang);

      // Save to AsyncStorage
      await AsyncStorage.setItem('app_language', lang);

      // Save to database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', user.id);
      }

      // Handle RTL for Hebrew
      const isRTL = lang === 'he';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        // Note: App needs to be restarted for RTL changes to take effect
        // You might want to show a message to the user
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
