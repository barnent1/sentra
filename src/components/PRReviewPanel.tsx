"use client";

import { useState, useEffect } from 'react';
import { X, GitBranch, Check, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import type { PullRequestData } from '@/services/quetrex-api';
import { getPullRequest, getPRDiff, approvePullRequest, requestChangesPullRequest, mergePullRequest, getSettings } from '@/services/quetrex-api';

interface PRReviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  prNumber: number;
}

type MergeMethod = 'merge' | 'squash' | 'rebase';

export function PRReviewPanel({ isOpen, onClose, owner, repo, prNumber }: PRReviewPanelProps) {
  const [prData, setPRData] = useState<PullRequestData | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [changesComment, setChangesComment] = useState('');
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [hasGitHubToken, setHasGitHubToken] = useState(true);

  // Check for GitHub token
  useEffect(() => {
    if (!isOpen) return;

    const checkGitHubToken = async () => {
      try {
        const settings = await getSettings();
        setHasGitHubToken(!!settings.githubToken);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setHasGitHubToken(false);
      }
    };

    checkGitHubToken();
  }, [isOpen]);

  // Fetch PR data and diff
  useEffect(() => {
    if (!isOpen || !hasGitHubToken) return;

    const fetchPRData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [prDataResponse, diffResponse] = await Promise.all([
          getPullRequest(owner, repo, prNumber),
          getPRDiff(owner, repo, prNumber),
        ]);
        setPRData(prDataResponse);
        setDiff(diffResponse);
      } catch (err) {
        console.error('Failed to fetch PR data:', err);
        if (err instanceof Error) {
          if (err.message.includes('GitHub token not configured')) {
            setError('GitHub token not configured. Please configure it in Settings.');
          } else if (err.message.includes('Invalid GitHub token')) {
            setError('Invalid GitHub token. Please check your settings.');
          } else if (err.message.includes('Pull request not found')) {
            setError('Pull request not found.');
          } else if (err.message.includes('Insufficient permissions')) {
            setError('Insufficient permissions to access this pull request.');
          } else {
            setError(err.message || 'Failed to load pull request data');
          }
        } else {
          setError('Failed to load pull request data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPRData();
  }, [isOpen, hasGitHubToken, owner, repo, prNumber]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approvePullRequest(owner, repo, prNumber);
      onClose();
    } catch (err) {
      console.error('Failed to approve PR:', err);
      setError('Failed to approve pull request');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = () => {
    setShowRequestChanges(true);
    setShowMergeOptions(false);
  };

  const handleSubmitChanges = async () => {
    if (!changesComment.trim()) return;

    setIsRequestingChanges(true);
    try {
      await requestChangesPullRequest(owner, repo, prNumber, changesComment);
      onClose();
    } catch (err) {
      console.error('Failed to request changes:', err);
      setError('Failed to request changes');
    } finally {
      setIsRequestingChanges(false);
    }
  };

  const handleMergeClick = () => {
    setShowMergeOptions(!showMergeOptions);
    setShowRequestChanges(false);
  };

  const handleMerge = async (method: MergeMethod) => {
    setIsMerging(true);
    try {
      await mergePullRequest(owner, repo, prNumber, method);
      onClose();
    } catch (err) {
      console.error('Failed to merge PR:', err);
      setError('Failed to merge pull request');
    } finally {
      setIsMerging(false);
    }
  };

  const getChecksStatusColor = () => {
    if (!prData) return 'bg-gray-500';
    switch (prData.pr.checksStatus) {
      case 'success':
        return 'bg-green-500';
      case 'failure':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getChecksStatusIcon = () => {
    if (!prData) return <Clock className="w-4 h-4" />;
    switch (prData.pr.checksStatus) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'failure':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const canMerge = prData && prData.pr.mergeable && prData.pr.checksStatus === 'success';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="pr-backdrop"
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="pr-review-panel"
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 bg-[#18181B] z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#18181B] border-b border-[#27272A] p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GitBranch className="w-6 h-6 text-violet-400" />
              <div>
                <h2 className="text-2xl font-semibold text-[#FAFAFA]">
                  Pull Request #{prNumber}
                </h2>
                {prData && (
                  <p className="text-sm text-[#A1A1AA] mt-1">
                    {prData.pr.headBranch} → {prData.pr.baseBranch}
                  </p>
                )}
              </div>
            </div>
            <button
              data-testid="pr-close-button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
            >
              <X className="w-5 h-5 text-violet-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasGitHubToken ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">
                    GitHub Token Required
                  </h3>
                  <p className="text-[#FAFAFA] mb-4">
                    You need to configure a GitHub token to review pull requests. The token is used to fetch PR data and perform actions like approving, requesting changes, and merging.
                  </p>
                  <p className="text-sm text-[#A1A1AA]">
                    Go to Settings and add your GitHub Personal Access Token with the following scopes:
                  </p>
                  <ul className="list-disc list-inside text-sm text-[#A1A1AA] mt-2 space-y-1">
                    <li>repo (full control of private repositories)</li>
                    <li>pull_request (read and write pull requests)</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <p className="text-[#A1A1AA]">Loading pull request...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-lg font-medium mb-2">Error</p>
              <p className="text-[#A1A1AA]">{error}</p>
            </div>
          ) : prData ? (
            <div className="space-y-6">
              {/* PR Title and Metadata */}
              <div className="bg-[#27272A] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#FAFAFA] mb-2">
                  {prData.pr.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                  <span>By {prData.pr.author}</span>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <div
                      data-testid="checks-status"
                      className={`w-2 h-2 rounded-full ${getChecksStatusColor()}`}
                    />
                    <span className="capitalize">{prData.pr.checksStatus}</span>
                    {getChecksStatusIcon()}
                  </div>
                </div>
              </div>

              {/* PR Description */}
              {prData.pr.body && (
                <div className="bg-[#27272A] rounded-lg p-6">
                  <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Description</h4>
                  <div className="text-[#FAFAFA] whitespace-pre-wrap">
                    {prData.pr.body}
                  </div>
                </div>
              )}

              {/* Diff Viewer */}
              <div className="bg-[#27272A] rounded-lg p-6">
                <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Changes</h4>
                <div
                  data-testid="diff-viewer"
                  className="bg-[#0A0A0B] rounded-lg p-4 overflow-x-auto font-mono text-xs"
                >
                  <pre className="text-[#FAFAFA] whitespace-pre">
                    {diff}
                  </pre>
                </div>
              </div>

              {/* Review Comments */}
              <div data-testid="review-comments" className="bg-[#27272A] rounded-lg p-6">
                <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Review Comments</h4>
                {prData.comments.length === 0 ? (
                  <p className="text-sm text-[#A1A1AA]">No review comments yet</p>
                ) : (
                  <div className="space-y-3">
                    {prData.comments.map((comment) => (
                      <div key={comment.id} className="bg-[#18181B] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-violet-400">
                            {comment.author}
                          </span>
                          <span className="text-xs text-[#A1A1AA]">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#FAFAFA]">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Changes Form */}
              {showRequestChanges && (
                <div className="bg-[#27272A] rounded-lg p-6">
                  <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Request Changes</h4>
                  <textarea
                    data-testid="changes-comment-textarea"
                    value={changesComment}
                    onChange={(e) => setChangesComment(e.target.value)}
                    placeholder="Explain what changes are needed..."
                    className="w-full h-32 px-4 py-3 bg-[#18181B] border border-[#3f3f46] rounded-lg text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      data-testid="submit-changes-button"
                      onClick={handleSubmitChanges}
                      disabled={!changesComment.trim() || isRequestingChanges}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isRequestingChanges ? 'Requesting Changes...' : 'Request Changes'}
                    </button>
                    <button
                      onClick={() => setShowRequestChanges(false)}
                      className="px-4 py-2 bg-[#3f3f46] hover:bg-[#52525B] text-[#FAFAFA] rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Merge Options */}
              {showMergeOptions && (
                <div className="bg-[#27272A] rounded-lg p-6">
                  <h4 className="text-sm font-medium text-[#A1A1AA] mb-3">Merge Method</h4>
                  <div className="space-y-2">
                    <button
                      data-testid="merge-method-squash"
                      onClick={() => handleMerge('squash')}
                      disabled={isMerging}
                      className="w-full text-left px-4 py-3 bg-[#18181B] hover:bg-[#27272A] border border-[#3f3f46] hover:border-violet-500 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-[#FAFAFA]">Squash and merge</div>
                      <div className="text-xs text-[#A1A1AA] mt-1">
                        Combine all commits into one
                      </div>
                    </button>
                    <button
                      data-testid="merge-method-merge"
                      onClick={() => handleMerge('merge')}
                      disabled={isMerging}
                      className="w-full text-left px-4 py-3 bg-[#18181B] hover:bg-[#27272A] border border-[#3f3f46] hover:border-violet-500 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-[#FAFAFA]">Create a merge commit</div>
                      <div className="text-xs text-[#A1A1AA] mt-1">
                        Keep all commits in the history
                      </div>
                    </button>
                    <button
                      data-testid="merge-method-rebase"
                      onClick={() => handleMerge('rebase')}
                      disabled={isMerging}
                      className="w-full text-left px-4 py-3 bg-[#18181B] hover:bg-[#27272A] border border-[#3f3f46] hover:border-violet-500 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-[#FAFAFA]">Rebase and merge</div>
                      <div className="text-xs text-[#A1A1AA] mt-1">
                        Rebase commits onto base branch
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  data-testid="approve-button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-6 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
                <button
                  data-testid="request-changes-button"
                  onClick={handleRequestChanges}
                  className="px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 rounded-lg font-medium transition-colors"
                >
                  Request Changes
                </button>
                <button
                  data-testid="merge-button"
                  onClick={handleMergeClick}
                  disabled={!canMerge || isMerging}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isMerging ? 'Merging...' : 'Merge'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
