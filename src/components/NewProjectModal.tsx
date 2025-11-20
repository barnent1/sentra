'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { createProject, selectDirectory, getTemplates, type Template } from '@/services/sentra-api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [template, setTemplate] = useState('nextjs');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateName = useCallback((value: string, showError: boolean = false): boolean => {
    // Project name can only contain letters, numbers, hyphens, and underscores
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!value) {
      if (showError) setNameError('');
      return false;
    }
    if (!nameRegex.test(value)) {
      if (showError) {
        setNameError('Project name can only contain letters, numbers, hyphens, and underscores');
      }
      return false;
    }
    if (showError) setNameError('');
    return true;
  }, []);

  // Fetch templates when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setName('');
      setPath('');
      setTemplate('nextjs');
      setNameError('');
      setCreating(false);
      setIsValid(false);

      // Fetch templates
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
  }, [isOpen]);

  // Update validation state whenever name or path changes
  useEffect(() => {
    const valid = name.trim() !== '' && path.trim() !== '' && validateName(name, false);
    setIsValid(valid);
  }, [name, path, validateName]);

  const handleNameChange = (value: string) => {
    setName(value);
    // Validate but don't show error on change, just for form validation
    validateName(value, false);
  };

  const handleNameBlur = () => {
    // Show error on blur
    validateName(name, true);
  };

  const handleBrowse = async () => {
    try {
      const selectedPath = await selectDirectory();
      if (selectedPath && name) {
        // Append project name to selected directory
        setPath(`${selectedPath}/${name}`);
      } else if (selectedPath) {
        setPath(selectedPath);
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  const handleCreate = async () => {
    if (!isValid) return;

    try {
      setCreating(true);
      await createProject({ name, path, template });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create project: ${errorMessage}`);
    } finally {
      setCreating(false);
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

          {/* Project Path */}
          <div>
            <label htmlFor="project-path" className="block text-sm font-medium text-slate-300 mb-2">
              Project Path
            </label>
            <div className="flex gap-2">
              <input
                id="project-path"
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/Users/username/projects/my-project"
                className="flex-1 bg-slate-800 border border-violet-500/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
              />
              <button
                onClick={handleBrowse}
                className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/50 rounded-lg text-violet-300 transition-colors flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Browse...
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              The full path where your project will be created
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
      </div>
    </div>
  );
}
