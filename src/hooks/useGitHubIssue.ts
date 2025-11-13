import { useState } from 'react';
import { createGithubIssue } from '@/lib/tauri';

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
}

export function useGitHubIssue() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const createIssue = async (options: CreateIssueOptions): Promise<string | null> => {
    setIsCreating(true);
    setError(null);
    setIssueUrl(null);

    try {
      const url = await createGithubIssue(
        options.title,
        options.body,
        options.labels || ['ai-feature']
      );
      setIssueUrl(url);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create GitHub issue';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const reset = () => {
    setIsCreating(false);
    setError(null);
    setIssueUrl(null);
  };

  return {
    createIssue,
    isCreating,
    error,
    issueUrl,
    reset,
  };
}
