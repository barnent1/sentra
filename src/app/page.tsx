"use client";

import { useState } from "react";
import Image from "next/image";
import { Activity, Folder, DollarSign, TrendingUp, Loader2, Settings as SettingsIcon, UserCircle, Mic, FileText, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "@/hooks/useDashboard";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "@/components/Settings";
import { ArchitectChat } from "@/components/ArchitectChat";
import { SpecViewer } from "@/components/SpecViewer";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { NewProjectModal } from "@/components/NewProjectModal";
import { UserMenu } from "@/components/UserMenu";
import { createGithubIssue, approveSpecVersion, setProjectMuted, type SpecInfo, type Project } from "@/services/sentra-api";
import "@/lib/i18n"; // Initialize i18n

export default function Home() {
  const { t } = useTranslation();
  const { projects, agents, stats, loading, refetch } = useDashboard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [architectChatOpen, setArchitectChatOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ name: string; path: string } | null>(null);
  const [specViewerOpen, setSpecViewerOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<{ spec: string; specInfo?: SpecInfo; name: string; path: string } | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [detailPanelProject, setDetailPanelProject] = useState<Project | null>(null);

  const handleSpeakToArchitect = (project: { name: string; path: string }) => {
    console.log(`Starting voice conversation for project: ${project.name}`);
    setSelectedProject(project);
    setArchitectChatOpen(true);
  };

  const handleViewSpec = async (project: { name: string; path: string; specs?: SpecInfo[] }) => {
    // Find the first unapproved spec (pending spec)
    const pendingSpec = project.specs?.find(spec => !spec.isApproved);

    if (pendingSpec) {
      try {
        const { listSpecs, getSpec } = await import('@/services/sentra-api');

        // Get the full spec content and metadata
        const { content, info } = await getSpec(
          project.name,
          project.path,
          pendingSpec.id
        );

        setSelectedSpec({
          spec: content,
          specInfo: info,
          name: project.name,
          path: project.path
        });
        setSpecViewerOpen(true);
      } catch (error) {
        console.error('Failed to load spec:', error);
        alert('Failed to load specification. Please try again.');
      }
    }
  };

  const handleApproveSpec = async () => {
    if (!selectedSpec || !selectedSpec.specInfo) {
      console.error('No spec selected for approval');
      throw new Error('No spec selected');
    }

    try {
      const { logger } = await import('@/services/logger');

      logger.info('Starting spec approval process', {
        project: selectedSpec.name,
        specTitle: selectedSpec.specInfo.title,
        specId: selectedSpec.specInfo.id,
      });

      // Create GitHub issue using gh CLI
      const title = `[AI Feature] ${selectedSpec.specInfo.title}`;
      const body = `${selectedSpec.spec}\n\n---\nSpec file: ${selectedSpec.specInfo.filePath}`;

      logger.info('Creating GitHub issue from spec', {
        project: selectedSpec.name,
        specTitle: selectedSpec.specInfo.title,
      });

      const issueUrl = await createGithubIssue(
        title,
        body,
        ['ai-feature']
      );

      logger.info('GitHub issue created successfully', {
        project: selectedSpec.name,
        issueUrl,
      });

      // Approve the spec version (new versioning system)
      const versionFile = selectedSpec.specInfo.filePath.split('/').pop() || '';

      logger.info('Approving spec version', {
        project: selectedSpec.name,
        specId: selectedSpec.specInfo.id,
        versionFile,
        issueUrl,
      });

      await approveSpecVersion(
        selectedSpec.name,
        selectedSpec.path,
        selectedSpec.specInfo.id,
        versionFile,
        issueUrl
      );

      logger.info('Spec approval process completed', {
        project: selectedSpec.name,
        specId: selectedSpec.specInfo.id,
      });

      // Refresh the projects list
      await refetch();
    } catch (error) {
      const { logger } = await import('@/services/logger');
      logger.error('Spec approval process failed', error);
      throw error; // Re-throw to let SpecViewer handle the error display
    }
  };

  const handleRejectSpec = async () => {
    if (!selectedSpec || !selectedSpec.specInfo) {
      console.error('No spec selected for rejection');
      throw new Error('No spec selected');
    }

    try {
      console.log(`[Reject] Starting rejection process for ${selectedSpec.name}`);
      console.log(`[Reject] Spec title: ${selectedSpec.specInfo.title}`);

      // Delete the spec (or specific version)
      const { deleteSpec } = await import('@/services/sentra-api');
      const versionFile = selectedSpec.specInfo.filePath.split('/').pop() || '';

      console.log(`[Reject] Deleting spec version: ${versionFile}`);
      await deleteSpec(
        selectedSpec.name,
        selectedSpec.path,
        selectedSpec.specInfo.id,
        versionFile
      );

      console.log(`[Reject] ✅ Spec deleted successfully`);

      // Refresh the projects list
      console.log(`[Reject] Refreshing projects list...`);
      await refetch();

      console.log(`[Reject] ✅ Rejection process completed`);
    } catch (error) {
      console.error('[Reject] ❌ Failed to reject spec:', error);
      throw error; // Re-throw to let SpecViewer handle the error display
    }
  };

  const handleMuteToggle = async (projectName: string, shouldMute: boolean) => {
    try {
      await setProjectMuted(projectName, shouldMute);
      // Refresh to get updated mute state
      refetch();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      alert('Failed to update mute state. Please try again.');
    }
  };

  const handleViewDetails = (project: Project) => {
    setDetailPanelProject(project);
    setDetailPanelOpen(true);
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: ',',
      meta: true,
      description: 'Open Settings',
      handler: () => setSettingsOpen(true),
    },
    {
      key: 'n',
      meta: true,
      description: 'New Project',
      handler: () => setNewProjectOpen(true),
    },
    {
      key: 'Escape',
      description: 'Close Modal',
      handler: () => {
        setSettingsOpen(false);
        setNewProjectOpen(false);
        setArchitectChatOpen(false);
        setSpecViewerOpen(false);
        setDetailPanelOpen(false);
      },
    },
  ], !settingsOpen && !newProjectOpen && !architectChatOpen && !specViewerOpen && !detailPanelOpen);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </main>
    );
  }

  const remainingBudget = stats ? (stats.monthlyBudget ?? 100) - (stats.todayCost ?? 0) : 0;

  return (
    <ProtectedRoute>
      <main id="main-content" className="min-h-screen bg-[#0A0A0B] p-8">
        {/* Header */}
        <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-16 h-16 flex items-center justify-center">
              <Image
                src="/sentra-logo.png"
                alt="Sentra"
                width={64}
                height={64}
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* New Project Button */}
            <button
              data-testid="new-project-button"
              onClick={() => setNewProjectOpen(true)}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              title={t('dashboard.buttons.newProject')}
            >
              <Plus className="w-5 h-5" />
              {t('dashboard.buttons.newProject')}
            </button>

            {/* User Menu with Avatar */}
            <UserMenu onSettingsClick={() => setSettingsOpen(true)} />
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={() => {
          // Refresh projects list after creating a new project
          refetch();
        }}
      />

      {/* Architect Chat Modal */}
      <ArchitectChat
        isOpen={architectChatOpen}
        onClose={() => {
          setArchitectChatOpen(false);
          // Refresh projects to pick up any new pending specs
          refetch();
        }}
        projectName={selectedProject?.name || ''}
        projectPath={selectedProject?.path}
      />

      {/* Spec Viewer Modal */}
      {selectedSpec && (
        <SpecViewer
          isOpen={specViewerOpen}
          onClose={() => setSpecViewerOpen(false)}
          spec={selectedSpec.spec}
          specInfo={selectedSpec.specInfo}
          projectName={selectedSpec.name}
          projectPath={selectedSpec.path}
          onApprove={handleApproveSpec}
          onReject={handleRejectSpec}
        />
      )}

      {/* Project Detail Panel */}
      {detailPanelProject && (
        <ProjectDetailPanel
          project={detailPanelProject}
          isOpen={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
        />
      )}

      {/* Stats Overview */}
      <div data-testid="stats-grid" className="grid grid-cols-4 gap-6 mb-8">
        <div data-testid="stat-card" className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 transition-all hover:border-[#3f3f46]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A1A1AA]">{t('dashboard.stats.activeAgents')}</span>
            <Activity className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-[#FAFAFA]">{stats?.activeAgents || 0}</p>
          <p className="text-xs text-green-400 mt-1">
            {stats?.activeAgents ? t('dashboard.stats.running') : t('dashboard.stats.idle')}
          </p>
        </div>

        <div data-testid="stat-card" className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 transition-all hover:border-[#3f3f46]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A1A1AA]">{t('dashboard.stats.projects')}</span>
            <Folder className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-[#FAFAFA]">{stats?.totalProjects || 0}</p>
          <p className="text-xs text-[#A1A1AA] mt-1">{t('dashboard.stats.tracked')}</p>
        </div>

        <div data-testid="stat-card" className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 transition-all hover:border-[#3f3f46]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A1A1AA]">{t('dashboard.stats.todayCost')}</span>
            <DollarSign className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-[#FAFAFA]">${(stats?.todayCost ?? 0).toFixed(2)}</p>
          <p className="text-xs text-[#A1A1AA] mt-1">
            ${remainingBudget.toFixed(2)} {t('dashboard.stats.remaining')}
          </p>
        </div>

        <div data-testid="stat-card" className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 transition-all hover:border-[#3f3f46]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A1A1AA]">{t('dashboard.stats.successRate')}</span>
            <TrendingUp className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-[#FAFAFA]">{stats?.successRate ?? 0}%</p>
          <p className="text-xs text-green-400 mt-1">
            {stats && (stats.successRate ?? 0) >= 90 ? t('dashboard.stats.thisWeek') : t('dashboard.stats.improving')}
          </p>
        </div>
      </div>

      {/* Active Agents */}
      <div className="sentra-card mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.activeAgentsSection.title')}</h2>
        {agents.length === 0 ? (
          <div className="sentra-glass p-8 rounded-lg text-center">
            <p className="text-muted-foreground">{t('dashboard.activeAgentsSection.noAgents')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('dashboard.activeAgentsSection.noAgentsSubtext')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="sentra-glass p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <p className="font-medium">
                        {agent.project} - Issue #{agent.issue}
                      </p>
                      <p className="text-sm text-muted-foreground">{agent.title}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded sentra-status-running">
                    {agent.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{agent.phase}</span>
                  <span>•</span>
                  <span>{t('dashboard.activeAgentsSection.elapsed', { minutes: agent.elapsedMinutes })}</span>
                  <span>•</span>
                  <span>{t('dashboard.activeAgentsSection.spent', { cost: (agent.cost ?? 0).toFixed(2) })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div id="projects-section" className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#FAFAFA]">{t('dashboard.projectsSection.title')}</h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[#0A0A0B] p-8 rounded-lg text-center">
            <p className="text-[#A1A1AA]">{t('dashboard.projectsSection.noProjects')}</p>
            <p className="text-sm text-[#A1A1AA] mt-2">
              {t('dashboard.projectsSection.noProjectsSubtext')}
            </p>
          </div>
        ) : (
          <div data-testid="projects-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.name}
                project={project}
                onMuteToggle={handleMuteToggle}
                onViewDetails={handleViewDetails}
                onSpeakToArchitect={handleSpeakToArchitect}
                onViewSpec={handleViewSpec}
              />
            ))}
          </div>
        )}
      </div>
      </main>
    </ProtectedRoute>
  );
}
