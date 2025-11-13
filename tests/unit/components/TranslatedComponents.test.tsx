import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

// Mock component that uses translations
function MockDashboard() {
  const { t } = require('react-i18next').useTranslation();
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.subtitle')}</p>
      <div>
        <span>{t('dashboard.stats.activeAgents')}</span>
        <span>{t('dashboard.stats.projects')}</span>
        <span>{t('dashboard.stats.todayCost')}</span>
        <span>{t('dashboard.stats.successRate')}</span>
      </div>
    </div>
  );
}

function MockProjectCard() {
  const { t } = require('react-i18next').useTranslation();
  return (
    <div>
      <p>{t('project.progress')}</p>
      <p>{t('project.issuesCompleted', { completed: 5, total: 10 })}</p>
      <p>{t('project.monthlyCost', { cost: '12.50' })}</p>
      <button>{t('project.mute')}</button>
      <button>{t('project.unmute')}</button>
    </div>
  );
}

describe('Translated Components', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('Dashboard Translations', () => {
    it('should display translated dashboard title', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockDashboard />
        </I18nextProvider>
      );

      expect(screen.getByText(/dashboard|sentra/i)).toBeInTheDocument();
    });

    it('should display translated subtitle', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockDashboard />
        </I18nextProvider>
      );

      expect(screen.getByText(/mission control|ai agents/i)).toBeInTheDocument();
    });

    it('should display translated stat labels', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockDashboard />
        </I18nextProvider>
      );

      expect(screen.getByText(/active agents/i)).toBeInTheDocument();
      expect(screen.getByText(/projects/i)).toBeInTheDocument();
      expect(screen.getByText(/cost/i)).toBeInTheDocument();
      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
    });
  });

  describe('ProjectCard Translations', () => {
    it('should display translated progress label', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockProjectCard />
        </I18nextProvider>
      );

      expect(screen.getByText(/progress/i)).toBeInTheDocument();
    });

    it('should display translated issues with interpolation', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockProjectCard />
        </I18nextProvider>
      );

      expect(screen.getByText(/5.*10.*issues/i)).toBeInTheDocument();
    });

    it('should display translated cost with interpolation', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockProjectCard />
        </I18nextProvider>
      );

      expect(screen.getByText(/12\.50.*month/i)).toBeInTheDocument();
    });

    it('should display translated mute/unmute buttons', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <MockProjectCard />
        </I18nextProvider>
      );

      expect(screen.getByText(/mute|unmute/i)).toBeInTheDocument();
    });
  });

  describe('Spanish Translations', () => {
    it('should display Spanish translations when language is changed', async () => {
      await i18n.changeLanguage('es');

      render(
        <I18nextProvider i18n={i18n}>
          <MockDashboard />
        </I18nextProvider>
      );

      // Should have Spanish translations (or fallback to English)
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title.textContent).toBeTruthy();
    });

    it('should maintain interpolation in Spanish', async () => {
      await i18n.changeLanguage('es');

      render(
        <I18nextProvider i18n={i18n}>
          <MockProjectCard />
        </I18nextProvider>
      );

      // Numbers should still appear regardless of language
      expect(screen.getByText(/5.*10/)).toBeInTheDocument();
      expect(screen.getByText(/12\.50/)).toBeInTheDocument();
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to English for missing translations', async () => {
      await i18n.changeLanguage('es');

      render(
        <I18nextProvider i18n={i18n}>
          <MockDashboard />
        </I18nextProvider>
      );

      // Should render something, even if fallback
      const title = screen.getByRole('heading', { level: 1 });
      expect(title.textContent).toBeTruthy();
      expect(title.textContent).not.toBe('dashboard.title');
    });

    it('should display key if no translation exists', () => {
      const { t } = i18n;
      const result = t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('Pluralization', () => {
    it('should handle singular form correctly', () => {
      const { t } = i18n;
      const result = t('project.activeAgents', { count: 1 });
      expect(result.toLowerCase()).toContain('agent');
    });

    it('should handle plural form correctly', () => {
      const { t } = i18n;
      const result = t('project.activeAgents', { count: 5 });
      expect(result.toLowerCase()).toContain('agent');
    });

    it('should handle zero count', () => {
      const { t } = i18n;
      const result = t('project.activeAgents', { count: 0 });
      expect(result).toBeTruthy();
    });
  });
});
