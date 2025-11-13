import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../../public/locales/en/common.json';
import esCommon from '../../public/locales/es/common.json';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Resources
    resources: {
      en: {
        common: enCommon,
      },
      es: {
        common: esCommon,
      },
    },

    // Fallback language
    fallbackLng: ['en'],

    // Default namespace
    ns: ['common'],
    defaultNS: 'common',

    // Debug mode (only in development)
    debug: false,

    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],

      // Keys to use for localStorage
      lookupLocalStorage: 'i18nextLng',

      // Cache user language
      caches: ['localStorage'],

      // Don't use cookie storage (not applicable in Tauri)
      excludeCacheFor: ['cimode'],
    },

    // React options
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
    },
  });

export default i18n;
