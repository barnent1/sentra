'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Github } from 'lucide-react';
import { createProject, createGitHubRepo, getTemplates, getSettings, type Template } from '@/services/sentra-api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('nextjs');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingStep, setCreatingStep] = useState('');
  const [nameError, setNameError] = useState('');
  const [creationError, setCreationError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [checkingGithub, setCheckingGithub] = useState(true);

  const validateName = useCallback((value: string, showError: boolean = false): boolean => {
    // GitHub repo name rules
    const nameRegex = /^[a-zA-Z0-9_][a-zA-Z0-9._-]{0,98}[a-zA-Z0-9_]$|^[a-zA-Z0-9_]$/;
    if (!value) {
      if (showError) setNameError('');
      return false;
    }
    if (!nameRegex.test(value)) {
      if (showError) {
        setNameError('Repository name can only contain letters, numbers, hyphens, underscores, and periods');
      }
      return false;
    }
    if (value.endsWith('.git')) {
      if (showError) {
        setNameError('Repository name cannot end with .git');
      }
      return false;
    }
    if (showError) setNameError('');
    return true;
  }, []);

  // Check GitHub connection and fetch templates when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setName('');
      setDescription('');
      setTemplate('nextjs');
      setNameError('');
      setCreationError('');
      setCreating(false);
      setCreatingStep('');
      setIsValid(false);
      setCheckingGithub(true);
      setGithubConnected(false);

      // Check GitHub connection
      getSettings()
        .then((settings) => {
          const isConnected = Boolean(settings.githubToken);
          setGithubConnected(isConnected);
          setCheckingGithub(false);

          // Only fetch templates if GitHub is connected
          if (isConnected) {
            setLoadingTemplates(true);
            getTemplates()
              .then((fetchedTemplates) => {
                setTemplates(fetchedTemplates);
                // Set default template if nextjs exists
                if (fetchedTemplates.some((t) => t.id === 'nextjs')) {
                  setTemplate('nextjs');
                } else if (fetchedTemplates.length > 0) {
                  setTemplate(fetchedTemplates[0].id);
                }
              })
              .catch((error) => {
                console.error('Failed to fetch templates:', error);
                // Fallback to hardcoded templates
                setTemplates([
                  {
                    id: 'nextjs',
                    name: 'Next.js',
                    description: 'React framework with App Router, TypeScript, and Tailwind CSS',
                    files: [],
                    directories: [],
                  },
                ]);
              })
              .finally(() => {
                setLoadingTemplates(false);
              });
          }
        })
        .catch((error) => {
          console.error('Failed to check GitHub connection:', error);
          setCheckingGithub(false);
          setGithubConnected(false);
        });
    }
  }, [isOpen]);

  // Update validation state whenever name changes
  useEffect(() => {
    const valid = name.trim() !== '' && validateName(name, false);
    setIsValid(valid);
  }, [name, validateName]);

  const handleNameChange = (value: string) => {
    setName(value);
    // Validate but don't show error on change, just for form validation
    validateName(value, false);
  };

  const handleNameBlur = () => {
    // Show error on blur
    validateName(name, true);
  };

  const handleCreate = async () => {
    if (!isValid) return;

    try {
      setCreating(true);
      setCreationError('');

      // Step 1: Create GitHub repository from template
      setCreatingStep('Creating GitHub repository from Sentra template...');
      const repo = await createGitHubRepo({
        name,
        description: description || `Sentra AI-powered project: ${name}`,
        private: true,
      });

      console.log(`✓ GitHub repository created: ${repo.url}`);

      // Step 2: Register project in Sentra
      setCreatingStep('Setting up Sentra configuration...');
      await createProject({
        name,
        path: repo.url,
        template
      });

      console.log(`✓ Project registered in Sentra`);

      setCreatingStep('Done!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCreationError(errorMessage);
      setCreating(false);
      setCreatingStep('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg p-6 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close new project modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {checkingGithub ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mb-4" />
            <p className="text-slate-300">Checking GitHub connection...</p>
          </div>
        ) : !githubConnected ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-500/10 rounded-full mb-4">
              <Github className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect GitHub First</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              To create projects with Sentra, you need to connect your GitHub account.
              This allows us to create repositories from templates and set up your project automatically.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  onClose();
                  // Navigate to settings
                  window.location.href = '/profile?tab=settings';
                }}
                className="bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Settings
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="e.g., my-awesome-project"
              className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
            {nameError && (
              <p className="text-xs text-red-400 mt-1">{nameError}</p>
            )}
          </div>

          {/* Description (Optional) */}
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-slate-300 mb-2">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <input
              id="project-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project"
              className="w-full bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Will be added to your GitHub repository description
            </p>
          </div>

          {/* Template Selection */}
          <div>
            <div className="block text-sm font-medium text-slate-300 mb-2" id="template-label">
              Template
            </div>
            {loadingTemplates ? (
              <div className="text-center py-8 text-slate-400">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mb-2" />
                <p className="text-sm">Loading templates...</p>
              </div>
            ) : (
              <div className="space-y-2" role="group" aria-labelledby="template-label">
                {templates.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      template === t.id
                        ? 'bg-violet-500/10 border-violet-500/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={t.id}
                      checked={template === t.id}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="text-violet-500 focus:ring-violet-500"
                      aria-label={`Template: ${t.name}`}
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Creation Error */}
          {creationError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 text-sm font-bold">!</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-400 font-medium mb-1">Failed to Create Project</h4>
                  <p className="text-sm text-slate-300">{creationError}</p>
                </div>
                <button
                  onClick={() => setCreationError('')}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Progress Message */}
          {creating && creatingStep && (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mb-2" />
              <p className="text-sm text-slate-300">{creatingStep}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={handleCreate}
              disabled={!isValid || creating}
              className="flex-1 bg-violet-500 hover:bg-violet-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
            <button
              onClick={onClose}
              disabled={creating}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
