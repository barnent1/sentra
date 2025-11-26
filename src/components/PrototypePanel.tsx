"use client";

import { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import type { Prototype } from '@/services/sentra-api';
import { getPrototypes, iteratePrototype } from '@/services/sentra-api';

interface PrototypePanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PrototypePanel({ projectId, isOpen, onClose }: PrototypePanelProps) {
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIterateModal, setShowIterateModal] = useState(false);
  const [selectedPrototype, setSelectedPrototype] = useState<Prototype | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iterationError, setIterationError] = useState<string | null>(null);

  // Fetch prototypes when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchPrototypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showIterateModal) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showIterateModal, onClose]);

  const fetchPrototypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPrototypes(projectId);
      // Sort by creation date (newest first)
      const sorted = [...data].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPrototypes(sorted);
    } catch (err) {
      setError('Failed to load prototypes');
      console.error('Error fetching prototypes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPrototype = (prototype: Prototype) => {
    window.open(prototype.deploymentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIterateClick = (prototype: Prototype) => {
    setSelectedPrototype(prototype);
    setFeedback('');
    setIterationError(null);
    setShowIterateModal(true);
  };

  const handleSubmitIteration = async () => {
    if (!selectedPrototype || !feedback.trim()) return;

    setIsSubmitting(true);
    setIterationError(null);
    try {
      await iteratePrototype(selectedPrototype.id, feedback);
      setShowIterateModal(false);
      setFeedback('');
      setSelectedPrototype(null);
      // Refresh prototypes list
      await fetchPrototypes();
    } catch (err) {
      setIterationError('Failed to submit iteration');
      console.error('Error iterating prototype:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelIteration = () => {
    setShowIterateModal(false);
    setFeedback('');
    setSelectedPrototype(null);
    setIterationError(null);
  };

  const getStatusBadge = (status: Prototype['deploymentStatus']) => {
    const badges = {
      ready: {
        text: 'Ready',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        testId: 'status-badge-ready',
      },
      deploying: {
        text: 'Deploying',
        className: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        testId: 'status-badge-deploying',
      },
      error: {
        text: 'Error',
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        testId: 'status-badge-error',
      },
      pending: {
        text: 'Pending',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        testId: 'status-badge-pending',
      },
    };

    const badge = badges[status];
    return (
      <span
        data-testid={badge.testId}
        className={`px-2 py-1 text-xs font-medium rounded border ${badge.className}`}
      >
        {badge.text}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="panel-backdrop"
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="prototype-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prototype-panel-header"
        className="fixed right-0 top-0 h-screen w-full md:w-2/3 lg:w-1/2 bg-[#18181B] border-l border-[#27272A] z-50 overflow-y-auto transition-transform animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#18181B] border-b border-[#27272A] p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 id="prototype-panel-header" className="text-2xl font-semibold text-[#FAFAFA]">
              Prototypes
            </h2>
            <button
              data-testid="close-panel-btn"
              onClick={onClose}
              aria-label="Close prototype panel"
              className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
            >
              <X className="w-5 h-5 text-violet-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <span className="ml-3 text-[#A1A1AA]">Loading prototypes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : prototypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#A1A1AA]">No prototypes yet</p>
              <p className="text-sm text-[#71717A] mt-2">
                Prototypes will appear here once generated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prototypes.map((prototype) => (
                <div
                  key={prototype.id}
                  className="bg-[#27272A] rounded-lg p-5 border border-[#3f3f46] hover:border-violet-500/50 transition-colors"
                >
                  {/* Title and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3
                        data-testid={`prototype-title-${prototype.id}`}
                        className="text-lg font-medium text-[#FAFAFA] mb-1"
                      >
                        {prototype.title}
                      </h3>
                      {prototype.description && (
                        <p className="text-sm text-[#A1A1AA]">{prototype.description}</p>
                      )}
                    </div>
                    {getStatusBadge(prototype.deploymentStatus)}
                  </div>

                  {/* Version */}
                  <div className="text-xs text-[#71717A] mb-4">
                    v{prototype.version}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      data-testid="view-prototype-btn"
                      onClick={() => handleViewPrototype(prototype)}
                      disabled={prototype.deploymentStatus !== 'ready'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 rounded-lg text-violet-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-500/10 disabled:hover:border-violet-500/30"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">View Prototype</span>
                    </button>

                    <button
                      data-testid="iterate-btn"
                      onClick={() => handleIterateClick(prototype)}
                      className="flex-1 px-4 py-2 bg-[#18181B] hover:bg-[#27272A] border border-[#3f3f46] hover:border-violet-500/50 rounded-lg text-[#FAFAFA] transition-colors"
                    >
                      <span className="text-sm font-medium">Iterate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Iterate Modal */}
      {showIterateModal && selectedPrototype && (
        <>
          {/* Modal Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={handleCancelIteration}
          />

          {/* Modal */}
          <div
            data-testid="iterate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="iterate-modal-header"
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-lg shadow-xl z-[70] p-6"
          >
            <h3
              id="iterate-modal-header"
              className="text-xl font-semibold text-[#FAFAFA] mb-2"
            >
              Provide Feedback
            </h3>
            <p className="text-sm text-[#A1A1AA] mb-4">
              Describe the changes you&apos;d like to make to &quot;{selectedPrototype.title}&quot;
            </p>

            <textarea
              data-testid="feedback-textarea"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe the changes you want (e.g., 'Move sidebar to left side', 'Change button color to green')"
              className="w-full h-32 px-4 py-3 bg-[#27272A] border border-[#3f3f46] rounded-lg text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />

            {iterationError && (
              <p className="text-sm text-red-400 mt-2">{iterationError}</p>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                data-testid="cancel-iteration-btn"
                onClick={handleCancelIteration}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#27272A] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-lg text-[#FAFAFA] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                data-testid="submit-iteration-btn"
                onClick={handleSubmitIteration}
                disabled={!feedback.trim() || isSubmitting}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 border border-violet-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
