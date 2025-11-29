'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Server } from 'lucide-react';

interface Runner {
  id: string;
  name: string;
  provider: string;
  region: string;
  status: string;
  ipAddress?: string;
}

interface DeleteRunnerModalProps {
  isOpen: boolean;
  runner: Runner | null;
  onClose: () => void;
  onConfirm: (runnerId: string) => Promise<void>;
}

export function DeleteRunnerModal({ isOpen, runner, onClose, onConfirm }: DeleteRunnerModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const CONFIRM_WORD = 'DELETE';
  const isConfirmValid = confirmText === CONFIRM_WORD;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setDeleting(false);
      setError('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !deleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, deleting, onClose]);

  const handleDelete = async () => {
    if (!isConfirmValid || !runner) return;

    try {
      setDeleting(true);
      setError('');
      await onConfirm(runner.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete runner');
      setDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmValid && !deleting) {
      handleDelete();
    }
  };

  if (!isOpen || !runner) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#18181B] border border-red-500/30 rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header with warning colors */}
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Delete Runner</h2>
              <p className="text-sm text-red-400">This action cannot be undone</p>
            </div>
            <button
              onClick={onClose}
              disabled={deleting}
              className="ml-auto text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Runner info card */}
          <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#27272A] flex items-center justify-center">
                <Server className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{runner.name}</p>
                <p className="text-sm text-gray-500">
                  {runner.provider} · {runner.region}
                  {runner.ipAddress && ` · ${runner.ipAddress}`}
                </p>
              </div>
              <div
                className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                  runner.status === 'active'
                    ? 'bg-green-500'
                    : runner.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Warning message */}
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              You are about to permanently delete this runner. This will:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Remove the runner from your Quetrex account</li>
              {runner.ipAddress && (
                <li>Delete the server from your Hetzner Cloud account</li>
              )}
              <li>Stop any running jobs on this runner</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div>
            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-300 mb-2">
              Type <span className="font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{CONFIRM_WORD}</span> to confirm
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder={CONFIRM_WORD}
              disabled={deleting}
              autoComplete="off"
              autoFocus
              className="w-full bg-[#0A0A0B] border border-[#27272A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 font-mono text-center tracking-wider disabled:opacity-50"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0A0A0B] border-t border-[#27272A] flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmValid || deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Runner'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
