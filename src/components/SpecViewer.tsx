'use client';

import { X, Check, XCircle } from 'lucide-react';

interface SpecViewerProps {
  isOpen: boolean;
  onClose: () => void;
  spec: string;
  projectName: string;
  projectPath: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function SpecViewer({
  isOpen,
  onClose,
  spec,
  projectName,
  projectPath,
  onApprove,
  onReject
}: SpecViewerProps) {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-violet-500/20 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Specification Review</h2>
            <p className="text-sm text-slate-400">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(spec) }}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Check className="w-5 h-5" />
            Approve & Create GitHub Issue
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
