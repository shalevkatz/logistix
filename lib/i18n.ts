import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from '../locales/en.json';
import he from '../locales/he.json';
import ru from '../locales/ru.json';

const i18n = new I18n({
  en,
  he,
  ru,
});

// Set the locale based on device settings
const deviceLocale = getLocales()[0]?.languageCode || 'en';
i18n.locale = deviceLocale;

// Enable fallback if translation is missing
i18n.enableFallback = true;

// Set default locale
i18n.defaultLocale = 'en';

export default i18n;
