import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '@/components/Settings';
import i18n from '@/lib/i18n';

// Mock Tauri API
vi.mock('@/lib/tauri', () => ({
  getSettings: vi.fn(() =>
    Promise.resolve({
      userName: 'Test User',
      voice: 'nova',
      openaiApiKey: '',
      anthropicApiKey: '',
      githubToken: '',
      githubRepoOwner: '',
      githubRepoName: '',
      notificationsEnabled: true,
      notifyOnCompletion: true,
      notifyOnFailure: true,
      notifyOnStart: false,
      language: 'en',
    })
  ),
  saveSettings: vi.fn(() => Promise.resolve()),
  speakNotification: vi.fn(() => Promise.resolve()),
}));

describe('Language Selector in Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.changeLanguage('en');
  });

  describe('Rendering', () => {
    it('should render language selector section', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        expect(screen.getByLabelText('English')).toBeInTheDocument();
      });
    });

    it('should display available language options', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        expect(screen.getByLabelText('English')).toBeInTheDocument();
        expect(screen.getByLabelText('Spanish')).toBeInTheDocument();
      });
    });

    it('should show current language as selected', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const englishOption = screen.getByLabelText('English') as HTMLInputElement;
        expect(englishOption.checked).toBe(true);
      });
    });

    it('should display language descriptions', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const englishLabels = screen.getAllByText('English');
        const spanishLabel = screen.getByText('Español');
        expect(englishLabels.length).toBeGreaterThan(0);
        expect(spanishLabel).toBeInTheDocument();
      });
    });
  });

  describe('Language Selection', () => {
    it('should change language when option is selected', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const spanishOption = screen.getByLabelText('Spanish');
        fireEvent.click(spanishOption);
      });

      await waitFor(() => {
        const spanishOption = screen.getByLabelText('Spanish') as HTMLInputElement;
        expect(spanishOption.checked).toBe(true);
      });
    });

    it('should update i18n instance when language changes', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const spanishOption = screen.getByLabelText('Spanish');
        fireEvent.click(spanishOption);
      });

      // Simulate saving settings
      await waitFor(() => {
        const saveButton = screen.getByText(/save settings/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(i18n.language).toBe('es');
      });
    });

    it('should persist language selection to localStorage', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const spanishOption = screen.getByLabelText('Spanish');
        fireEvent.click(spanishOption);
      });

      await waitFor(() => {
        const saveButton = screen.getByText(/save settings/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(localStorage.getItem('i18nextLng')).toBe('es');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for screen readers', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const englishOption = screen.getByLabelText('English');
        expect(englishOption).toHaveAttribute('type', 'radio');
        expect(englishOption).toHaveAttribute('name', 'language');
      });
    });

    it('should be keyboard navigable', async () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      await waitFor(() => {
        const englishOption = screen.getByLabelText('English');
        englishOption.focus();
        expect(document.activeElement).toBe(englishOption);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching settings', () => {
      render(<Settings isOpen={true} onClose={() => {}} />);

      // Should show loading text initially
      expect(screen.getByText(/loading settings/i)).toBeInTheDocument();
    });
  });
});
