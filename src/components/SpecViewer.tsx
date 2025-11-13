'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, ChevronDown, FileText } from 'lucide-react';
import type { SpecInfo, SpecVersion } from '@/lib/tauri';

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

  useEffect(() => {
    if (isOpen && specInfo) {
      loadVersions();
    }
  }, [isOpen, specInfo]);

  const loadVersions = async () => {
    if (!specInfo) return;

    try {
      const { getSpecVersions } = await import('@/lib/tauri');
      const versionList = await getSpecVersions(projectName, projectPath, specInfo.id);
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const loadVersion = async (versionFile: string) => {
    if (!specInfo) return;

    try {
      const { getSpec } = await import('@/lib/tauri');
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

  // Simple markdown-to-HTML renderer (basic support)
  const renderMarkdown = (markdown: string) => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mt-6 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-white">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-slate-950 border border-slate-700 rounded p-3 my-3 overflow-x-auto"><code class="text-sm text-slate-300">$2</code></pre>');

    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-violet-300">$1</code>');

    // Unordered lists
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 text-slate-300">$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-slate-300">$1</li>');

    // Paragraphs
    html = html.replace(/^(?!<[h|u|l|p|c])(.*$)/gim, '<p class="text-slate-300 my-2">$1</p>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  if (!isOpen) return null;

  const displayInfo = currentInfo || specInfo;
  const displayContent = currentContent || spec;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-semibold text-white">
                {displayInfo?.title || 'Specification Review'}
              </h2>
              <div className="flex items-center gap-2">
                {displayInfo && (
                  <>
                    <span className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-xs text-violet-300">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 flex gap-3">
          {onContinueEditing && displayInfo && (
            <button
              onClick={handleContinueEditing}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              Continue Editing
            </button>
          )}
          <button
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            disabled={displayInfo?.isApproved}
          >
            <Check className="w-5 h-5" />
            {displayInfo?.isApproved ? 'Already Approved' : 'Approve & Create GitHub Issue'}
          </button>
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Reject Specification
          </button>
        </div>
      </div>
    </div>
  );
}
