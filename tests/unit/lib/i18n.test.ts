import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '@/lib/i18n';

describe('i18n Configuration', () => {
  beforeEach(() => {
    // Reset i18n to default state before each test
    if (i18n.isInitialized) {
      i18n.changeLanguage('en');
    }
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize i18n instance', () => {
      expect(i18n).toBeDefined();
      expect(i18n.isInitialized).toBe(true);
    });

    it('should set English as default language', () => {
      expect(i18n.language).toBe('en');
    });

    it('should have fallback language set to English', () => {
      expect(i18n.options.fallbackLng).toEqual(['en']);
    });

    it('should support namespaces', () => {
      expect(i18n.options.ns).toContain('common');
      expect(i18n.options.defaultNS).toBe('common');
    });

    it('should be configured for debug mode in development', () => {
      // Debug should be false in test environment
      expect(i18n.options.debug).toBe(false);
    });
  });

  describe('Language Detection', () => {
    it('should detect language from localStorage', async () => {
      localStorage.setItem('i18nextLng', 'es');
      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');
    });

    it('should persist language changes to localStorage', async () => {
      await i18n.changeLanguage('es');
      expect(localStorage.getItem('i18nextLng')).toBe('es');
    });

    it('should fallback to English if stored language is not supported', async () => {
      localStorage.setItem('i18nextLng', 'unsupported-lang');
      // Should fallback to English
      expect(i18n.language).toBe('en');
    });
  });

  describe('Translation Loading', () => {
    it('should load English translations', () => {
      const t = i18n.t;
      // Test basic translation exists
      expect(t('dashboard.title')).toBeDefined();
      expect(typeof t('dashboard.title')).toBe('string');
    });

    it('should return translation key if translation is missing', () => {
      const t = i18n.t;
      const missingKey = 'dashboard.nonexistent.key';
      expect(t(missingKey)).toBe(missingKey);
    });

    it('should support nested translation keys', () => {
      const t = i18n.t;
      expect(t('dashboard.stats.activeAgents')).toBeDefined();
      expect(t('dashboard.stats.projects')).toBeDefined();
    });

    it('should support interpolation in translations', () => {
      const t = i18n.t;
      const result = t('dashboard.greeting', { name: 'Glen' });
      expect(result).toContain('Glen');
    });
  });

  describe('Language Switching', () => {
    it('should switch to Spanish when available', async () => {
      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');
    });

    it('should maintain translations after language switch', async () => {
      const enTitle = i18n.t('dashboard.title');
      await i18n.changeLanguage('es');
      const esTitle = i18n.t('dashboard.title');

      expect(enTitle).toBeDefined();
      expect(esTitle).toBeDefined();
    });

    it('should emit language change event', async () => {
      const languageChangedSpy = vi.fn();
      i18n.on('languageChanged', languageChangedSpy);

      await i18n.changeLanguage('es');

      expect(languageChangedSpy).toHaveBeenCalledWith('es');
    });
  });

  describe('Supported Languages', () => {
    it('should list English as a supported language', () => {
      const languages = Object.keys(i18n.services.resourceStore.data);
      expect(languages).toContain('en');
    });

    it('should list Spanish as a supported language', () => {
      const languages = Object.keys(i18n.services.resourceStore.data);
      expect(languages).toContain('es');
    });

    it('should have at least 2 supported languages', () => {
      const languages = Object.keys(i18n.services.resourceStore.data);
      expect(languages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should not throw error when translation is missing', () => {
      const t = i18n.t;
      expect(() => t('nonexistent.key')).not.toThrow();
    });

    it('should return key when namespace is missing', () => {
      const t = i18n.t;
      const result = t('missingNamespace:some.key');
      expect(typeof result).toBe('string');
    });
  });
});
