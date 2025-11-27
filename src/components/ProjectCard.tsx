"use client";

import { Volume2, Copy, HelpCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { Project, SpecInfo } from "@/services/quetrex-api";
import "@/lib/i18n"; // Initialize i18n

interface ProjectCardProps {
  project: Project;
  onMuteToggle: (projectName: string, shouldMute: boolean) => void;
  onViewDetails: (project: Project) => void;
  onSpeakToArchitect?: (project: { id: string; name: string; path: string }) => void;
  onViewSpec?: (project: { name: string; path: string; specs?: SpecInfo[] }) => void;
}

export function ProjectCard({ project, onMuteToggle, onViewDetails, onSpeakToArchitect, onViewSpec }: ProjectCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleArchitectClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    if (onSpeakToArchitect) {
      onSpeakToArchitect({ id: project.id, name: project.name, path: project.path });
    }
  };

  const handleSpecClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    if (onViewSpec) {
      onViewSpec(project);
    }
  };

  const handleCopyClone = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    const cloneCommand = `git clone ${project.path}`;
    try {
      await navigator.clipboard.writeText(cloneCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine status indicator color and animation
  const getStatusIndicatorClass = () => {
    switch (project.status) {
      case 'active':
        return 'bg-green-500 animate-pulse';
      case 'error':
        return 'bg-red-500 animate-pulse';
      case 'idle':
      default:
        return 'bg-gray-500';
    }
  };

  // Determine progress bar color
  const getProgressBarClass = () => {
    return project.status === 'active' ? 'bg-violet-600' : 'bg-gray-600';
  };

  // Format current task or show empty state
  const displayTask = project.currentTask || t('project.noActiveTasks');

  // Format active agents text
  const getActiveAgentsText = () => {
    if (project.activeAgents === 0) return null;
    return t('project.activeAgents', { count: project.activeAgents });
  };

  // Check for pending spec
  const pendingSpec = project.specs?.find(spec => !spec.isApproved);
  const specSizeKB = pendingSpec?.size ? (pendingSpec.size / 1024).toFixed(1) : null;

  return (
    <div
      data-testid="project-card"
      data-status={project.status}
      data-project-name={project.name}
      onClick={() => onViewDetails(project)}
      className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 transition-all hover:border-[#3f3f46] hover:shadow-lg cursor-pointer"
    >
      {/* Header with Status Indicator and Project Name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div
            data-testid="status-indicator"
            aria-label={`Status: ${project.status}`}
            className={`w-3 h-3 rounded-full ${getStatusIndicatorClass()}`}
          />
          {/* Project Name */}
          <h3
            data-testid="project-name"
            className="text-lg font-semibold text-[#FAFAFA]"
          >
            {project.name}
          </h3>
        </div>

        {/* Talk to Architect Button */}
        {onSpeakToArchitect && (
          <button
            data-testid="architect-button"
            onClick={handleArchitectClick}
            aria-label={t('dashboard.buttons.speakToArchitect', { projectName: project.name })}
            className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-violet-400" />
          </button>
        )}
      </div>

      {/* Spec Pending Badge */}
      {pendingSpec && onViewSpec && (
        <div className="mb-3">
          <button
            data-testid="spec-badge"
            onClick={handleSpecClick}
            className="px-3 py-1 bg-violet-500/20 border border-violet-500/50 rounded-full text-xs text-violet-300 animate-pulse hover:bg-violet-500/30 transition-colors"
          >
            📝 Spec Pending Review{specSizeKB ? ` (${specSizeKB} KB)` : ''}
          </button>
        </div>
      )}

      {/* Repository URL */}
      <div className="mb-3 flex items-center gap-2">
        <a
          href={project.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-violet-400 hover:text-violet-300 font-mono truncate flex items-center gap-1 flex-1"
        >
          {project.path}
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
        <button
          onClick={handleCopyClone}
          className="p-1 rounded hover:bg-[#27272A] transition-colors flex-shrink-0"
          title={copied ? "Copied!" : "Copy git clone command"}
        >
          <Copy className={`w-3 h-3 ${copied ? 'text-green-400' : 'text-gray-400'}`} />
        </button>
        <div className="relative flex-shrink-0">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-[#27272A] transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-gray-400" />
          </button>
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#27272A] border border-[#3F3F46] rounded-lg shadow-xl z-10 text-xs text-gray-300">
              <p className="font-semibold text-white mb-1">How to clone:</p>
              <code className="block bg-[#18181B] p-2 rounded mb-2 text-violet-400">
                git clone {project.path}
              </code>
              <p className="text-[10px] text-gray-400">
                This will download the project files to your computer so you can work on them locally.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Task */}
      <div className="mb-4">
        <p
          data-testid="current-task"
          title={project.currentTask}
          className="text-sm text-[#A1A1AA] truncate"
        >
          {displayTask}
        </p>
        {getActiveAgentsText() && (
          <p className="text-xs text-violet-400 mt-1">
            {getActiveAgentsText()}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#A1A1AA]">{t('project.progress')}</span>
          <span
            data-testid="progress-text"
            className="text-xs font-medium text-[#FAFAFA]"
          >
            {project.progress}%
          </span>
        </div>
        <div
          data-testid="progress-bar"
          className="w-full h-2 bg-[#27272A] rounded-full overflow-hidden"
        >
          <div
            data-testid="progress-fill"
            className={`h-full ${getProgressBarClass()} transition-all duration-300`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1 text-xs text-[#A1A1AA]">
        <p>
          {t('project.issuesCompleted', { completed: project.completedIssues, total: project.totalIssues })}
        </p>
        <p>
          {t('project.monthlyCost', { cost: project.monthlyCost.toFixed(2) })}
        </p>
      </div>
    </div>
  );
}
