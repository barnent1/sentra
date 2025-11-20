"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, GitBranch, FileText, DollarSign, Activity, GitPullRequest } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Project, GitCommit, GitStatus } from '@/services/sentra-api';
import { getGitLog, getGitStatus, getTelemetryLogs } from '@/services/sentra-api';
import { CostTracker } from '@/services/cost-tracker';
import { PRReviewPanel } from '@/components/PRReviewPanel';

interface ProjectDetailPanelProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'git' | 'logs' | 'costs';

export function ProjectDetailPanel({ project, isOpen, onClose }: ProjectDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [gitCommits, setGitCommits] = useState<GitCommit[]>([]);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState('');
  const [isLoadingGit, setIsLoadingGit] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [showPRReview, setShowPRReview] = useState(false);

  // Fetch git data when Git tab is active
  useEffect(() => {
    if (activeTab === 'git' && isOpen) {
      const fetchGitData = async () => {
        setIsLoadingGit(true);
        setGitError(null);
        try {
          const [commits, status] = await Promise.all([
            getGitLog(project.path, 10),
            getGitStatus(project.path),
          ]);
          setGitCommits(commits);
          setGitStatus(status);
        } catch (error) {
          console.error('Failed to fetch git data:', error);
          setGitError('Failed to load git data');
        } finally {
          setIsLoadingGit(false);
        }
      };
      fetchGitData();
    }
  }, [activeTab, isOpen, project.path]);

  // Fetch logs when Logs tab is active
  useEffect(() => {
    if (activeTab === 'logs' && isOpen) {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const logData = await getTelemetryLogs(project.name, 50);
          setLogs(logData);
        } catch (error) {
          console.error('Failed to fetch logs:', error);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, isOpen, project.name]);

  // Filter logs based on search input
  const filteredLogs = useMemo(() => {
    if (!logFilter) return logs;
    return logs.filter(log => log.toLowerCase().includes(logFilter.toLowerCase()));
  }, [logs, logFilter]);

  // Mock cost data for chart (in real app, this would come from CostTracker)
  const costChartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cost: Math.random() * 5 + 1, // Mock data
      };
    });
  }, []);

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

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: Tab) => {
    const tabs: Tab[] = ['overview', 'git', 'logs', 'costs'];
    const currentIndex = tabs.indexOf(currentTab);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex]);
    }
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
        data-testid="project-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-header"
        className="fixed right-0 top-0 h-screen w-full md:w-2/3 lg:w-1/2 bg-[#18181B] border-l border-[#27272A] z-50 overflow-y-auto transition-transform animate-slide-in-right"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#18181B] border-b border-[#27272A] p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 id="panel-header" className="text-2xl font-semibold text-[#FAFAFA]">
              {project.name}
            </h2>
            <button
              data-testid="close-button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-colors"
            >
              <X className="w-5 h-5 text-violet-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-6" role="tablist">
            <button
              data-testid="tab-overview"
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'overview'}
              data-active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              onKeyDown={(e) => handleTabKeyDown(e, 'overview')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Overview</span>
              </div>
            </button>

            <button
              data-testid="tab-git"
              id="tab-git"
              role="tab"
              aria-selected={activeTab === 'git'}
              data-active={activeTab === 'git'}
              onClick={() => setActiveTab('git')}
              onKeyDown={(e) => handleTabKeyDown(e, 'git')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'git'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="text-sm font-medium">Git</span>
              </div>
            </button>

            <button
              data-testid="tab-logs"
              id="tab-logs"
              role="tab"
              aria-selected={activeTab === 'logs'}
              data-active={activeTab === 'logs'}
              onClick={() => setActiveTab('logs')}
              onKeyDown={(e) => handleTabKeyDown(e, 'logs')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Logs</span>
              </div>
            </button>

            <button
              data-testid="tab-costs"
              id="tab-costs"
              role="tab"
              aria-selected={activeTab === 'costs'}
              data-active={activeTab === 'costs'}
              onClick={() => setActiveTab('costs')}
              onKeyDown={(e) => handleTabKeyDown(e, 'costs')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'costs'
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Costs</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div
          data-testid="tab-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="p-6"
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#27272A] rounded-lg p-4">
                  <p className="text-xs text-[#A1A1AA] mb-1">Active Agents</p>
                  <p className="text-2xl font-semibold text-[#FAFAFA]">{project.activeAgents}</p>
                </div>
                <div className="bg-[#27272A] rounded-lg p-4">
                  <p className="text-xs text-[#A1A1AA] mb-1">Progress</p>
                  <p className="text-2xl font-semibold text-[#FAFAFA]">{project.progress}%</p>
                </div>
                <div className="bg-[#27272A] rounded-lg p-4">
                  <p className="text-xs text-[#A1A1AA] mb-1">Issues</p>
                  <p className="text-2xl font-semibold text-[#FAFAFA]">
                    {project.completedIssues}/{project.totalIssues}
                  </p>
                </div>
                <div className="bg-[#27272A] rounded-lg p-4">
                  <p className="text-xs text-[#A1A1AA] mb-1">Monthly Cost</p>
                  <p className="text-2xl font-semibold text-[#FAFAFA]">
                    ${project.monthlyCost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Current Task */}
              <div>
                <h3 className="text-sm font-medium text-[#A1A1AA] mb-2">Current Task</h3>
                <p className="text-base text-[#FAFAFA]">
                  {project.currentTask || 'No active tasks'}
                </p>
              </div>

              {/* Recent Activity */}
              <div data-testid="recent-activity">
                <h3 className="text-sm font-medium text-[#A1A1AA] mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div>
                      <p className="text-[#FAFAFA]">Agent started working on issue #{project.totalIssues}</p>
                      <p className="text-xs text-[#A1A1AA]">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
                    <div>
                      <p className="text-[#FAFAFA]">Test suite passed</p>
                      <p className="text-xs text-[#A1A1AA]">15 minutes ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Git Tab */}
          {activeTab === 'git' && (
            <div className="space-y-6">
              {isLoadingGit ? (
                <div className="text-center py-8">
                  <p className="text-[#A1A1AA]">Loading git data...</p>
                </div>
              ) : gitError ? (
                <div className="text-center py-8">
                  <p className="text-red-400">Error: {gitError}</p>
                </div>
              ) : (
                <>
                  {/* Current Branch */}
                  {gitStatus && (
                    <div>
                      <h3 className="text-sm font-medium text-[#A1A1AA] mb-2">Current Branch</h3>
                      <p className="text-base text-[#FAFAFA]">{gitStatus.currentBranch}</p>
                      {gitStatus.ahead > 0 && (
                        <p className="text-xs text-violet-400 mt-1">
                          {gitStatus.ahead} commit{gitStatus.ahead > 1 ? 's' : ''} ahead
                        </p>
                      )}
                    </div>
                  )}

                  {/* PR Review Button */}
                  {project.prNumber && project.repoOwner && project.repoName && (
                    <div>
                      <button
                        data-testid="review-pr-button"
                        onClick={() => setShowPRReview(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 rounded-lg text-violet-400 transition-colors w-full"
                      >
                        <GitPullRequest className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Review Pull Request #{project.prNumber}</div>
                          <div className="text-xs text-[#A1A1AA]">
                            {project.repoOwner}/{project.repoName}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Recent Commits */}
                  <div>
                    <h3 className="text-sm font-medium text-[#A1A1AA] mb-3">Recent Commits</h3>
                    {gitCommits.length === 0 ? (
                      <p className="text-sm text-[#A1A1AA]">No commits found</p>
                    ) : (
                      <div className="space-y-3">
                        {gitCommits.map((commit) => (
                          <div
                            key={commit.hash}
                            className="bg-[#27272A] rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-xs text-violet-400 font-mono">
                                {commit.shortHash}
                              </code>
                              <span className="text-xs text-[#A1A1AA]">{commit.date}</span>
                            </div>
                            <p className="text-sm text-[#FAFAFA]">{commit.message}</p>
                            <p className="text-xs text-[#A1A1AA]">{commit.author}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Search/Filter */}
              <div>
                <input
                  data-testid="log-filter-input"
                  type="text"
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#27272A] border border-[#3f3f46] rounded-lg text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Logs Container */}
              <div
                data-testid="logs-container"
                className="bg-[#0A0A0B] rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto"
              >
                {isLoadingLogs ? (
                  <p className="text-[#A1A1AA]">Loading logs...</p>
                ) : filteredLogs.length === 0 ? (
                  <p className="text-[#A1A1AA]">
                    {logFilter ? 'No logs match the filter' : 'No logs available'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredLogs.map((log, index) => (
                      <div key={index} className="text-[#FAFAFA] whitespace-nowrap">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div className="space-y-6">
              {/* Total Cost */}
              <div className="bg-[#27272A] rounded-lg p-6">
                <p className="text-sm text-[#A1A1AA] mb-2">Total Monthly Cost</p>
                <p className="text-3xl font-bold text-[#FAFAFA]">
                  ${project.monthlyCost.toFixed(2)}
                </p>
              </div>

              {/* Daily Trend Chart */}
              <div>
                <h3 className="text-sm font-medium text-[#A1A1AA] mb-4">Daily Cost Trend (Last 7 Days)</h3>
                <div className="bg-[#27272A] rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis
                        dataKey="date"
                        stroke="#A1A1AA"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#A1A1AA"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: '1px solid #27272A',
                          borderRadius: '8px',
                          color: '#FAFAFA',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#7C3AED"
                        strokeWidth={2}
                        dot={{ fill: '#7C3AED', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div data-testid="cost-breakdown">
                <h3 className="text-sm font-medium text-[#A1A1AA] mb-3">Cost Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#27272A] rounded-lg p-3">
                    <span className="text-sm text-[#FAFAFA]">OpenAI (GPT-4)</span>
                    <span className="text-sm font-medium text-[#FAFAFA]">
                      ${(project.monthlyCost * 0.6).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#27272A] rounded-lg p-3">
                    <span className="text-sm text-[#FAFAFA]">Anthropic (Claude)</span>
                    <span className="text-sm font-medium text-[#FAFAFA]">
                      ${(project.monthlyCost * 0.4).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PR Review Panel */}
      {project.prNumber && project.repoOwner && project.repoName && (
        <PRReviewPanel
          isOpen={showPRReview}
          onClose={() => setShowPRReview(false)}
          owner={project.repoOwner}
          repo={project.repoName}
          prNumber={project.prNumber}
        />
      )}
    </>
  );
}
