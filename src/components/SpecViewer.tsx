'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, ChevronDown, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SpecInfo, SpecVersion } from '@/services/sentra-api';

interface SpecViewerProps {
  isOpen: boolean;
  onClose: () => void;
  spec: string;
  specInfo?: SpecInfo; // New: full spec metadata
  projectName: string;
  projectPath: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onContinueEditing?: (specInfo: SpecInfo) => void; // New: callback to continue editing
}

export function SpecViewer({
  isOpen,
  onClose,
  spec,
  specInfo,
  projectName,
  projectPath,
  onApprove,
  onReject,
  onContinueEditing
}: SpecViewerProps) {
  const [versions, setVersions] = useState<SpecVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>(spec);
  const [currentInfo, setCurrentInfo] = useState<SpecInfo | undefined>(specInfo);

  const loadVersions = async () => {
    if (!specInfo) return;

    try {
      const { getSpecVersions } = await import('@/services/sentra-api');
      const versionList = await getSpecVersions(projectName, projectPath, specInfo.id);
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && specInfo) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, specInfo]);

  const loadVersion = async (versionFile: string) => {
    if (!specInfo) return;

    try {
      const { getSpec } = await import('@/services/sentra-api');
      const { content, info } = await getSpec(projectName, projectPath, specInfo.id, versionFile);
      setCurrentContent(content);
      setCurrentInfo(info);
      setSelectedVersion(versionFile);
    } catch (error) {
      console.error('Failed to load version:', error);
      alert('Failed to load version. Please try again.');
    }
  };

  const handleApprove = async () => {
    try {
      await onApprove();
      onClose();
    } catch (error) {
      console.error('Failed to approve spec:', error);
      alert('Failed to approve spec. Please try again.');
    }
  };

  const handleReject = async () => {
    try {
      await onReject();
      onClose();
    } catch (error) {
      console.error('Failed to reject spec:', error);
      alert('Failed to reject spec. Please try again.');
    }
  };

  const handleContinueEditing = () => {
    if (currentInfo && onContinueEditing) {
      onContinueEditing(currentInfo);
      onClose();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };


  if (!isOpen) return null;

  const displayInfo = currentInfo || specInfo;
  const displayContent = currentContent || spec;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col" data-testid="spec-viewer-modal" role="dialog" aria-label="Specification Viewer">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-semibold text-white" data-testid="spec-title">
                {displayInfo?.title || 'Specification Review'}
              </h2>
              <div className="flex items-center gap-2">
                {displayInfo && (
                  <>
                    <span className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs text-violet-300" data-testid="version-badge">
                      v{displayInfo.version}
                    </span>
                    {displayInfo.isLatest && (
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">
                        Latest
                      </span>
                    )}
                    {displayInfo.isApproved && (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-300">
                        Approved
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
            data-testid="close-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Version Selector */}
        {versions.length > 0 && (
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Version:</label>
              <div className="relative">
                <select
                  value={selectedVersion || (displayInfo?.filePath.split('/').pop() || '')}
                  onChange={(e) => loadVersion(e.target.value)}
                  className="appearance-none bg-slate-800 border border-violet-500/30 rounded px-3 py-1.5 pr-8 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                  data-testid="version-selector"
                >
                  {versions.map((v) => (
                    <option key={v.file} value={v.file}>
                      Version {v.version} - {formatDate(v.created)} ({formatFileSize(v.size)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {displayInfo && displayInfo.githubIssueUrl && (
                <a
                  href={displayInfo.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  View GitHub Issue →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none" data-testid="spec-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({...props}) => <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
              h2: ({...props}) => <h2 className="text-xl font-semibold text-white mt-6 mb-3" {...props} />,
              h3: ({...props}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
              p: ({...props}) => <p className="text-slate-300 my-2" {...props} />,
              ul: ({...props}) => <ul className="list-disc ml-6 my-2 text-slate-300" {...props} />,
              ol: ({...props}) => <ol className="list-decimal ml-6 my-2 text-slate-300" {...props} />,
              li: ({...props}) => <li className="ml-2 text-slate-300" {...props} />,
              code: ({className, children, ...props}) => {
                const isInline = !className?.includes('language-');
                return isInline ?
                  <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-violet-300" {...props}>{children}</code> :
                  <code className="text-sm text-slate-300" {...props}>{children}</code>;
              },
              pre: ({...props}) => <pre className="bg-slate-950 border border-slate-700 rounded p-3 my-3 overflow-x-auto" {...props} />,
              strong: ({...props}) => <strong className="font-semibold text-white" {...props} />,
              em: ({...props}) => <em className="italic text-slate-300" {...props} />,
              a: ({...props}) => <a className="text-violet-400 hover:text-violet-300 underline" {...props} />,
              blockquote: ({...props}) => <blockquote className="border-l-4 border-violet-500 pl-4 italic text-slate-400 my-2" {...props} />,
              table: ({...props}) => <table className="border-collapse border border-slate-700 my-4" {...props} />,
              thead: ({...props}) => <thead className="bg-slate-800" {...props} />,
              th: ({...props}) => <th className="border border-slate-700 px-4 py-2 text-white font-semibold" {...props} />,
              td: ({...props}) => <td className="border border-slate-700 px-4 py-2 text-slate-300" {...props} />,
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 flex gap-3">
          {onContinueEditing && displayInfo && (
            <button
              onClick={handleContinueEditing}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              data-testid="continue-editing-button"
            >
              <FileText className="w-5 h-5" />
              Continue Editing
            </button>
          )}
          <button
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            disabled={displayInfo?.isApproved}
            data-testid="approve-button"
          >
            <Check className="w-5 h-5" />
            {displayInfo?.isApproved ? 'Already Approved' : 'Approve & Create GitHub Issue'}
          </button>
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            data-testid="reject-button"
          >
            <XCircle className="w-5 h-5" />
            Reject Specification
          </button>
        </div>
      </div>
    </div>
  );
}
