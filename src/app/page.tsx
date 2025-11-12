"use client";

import { useState } from "react";
import { Activity, Folder, DollarSign, TrendingUp, Loader2, Settings as SettingsIcon, UserCircle, Mic } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { Settings } from "@/components/Settings";
import { ArchitectChat } from "@/components/ArchitectChat";

export default function Home() {
  const { projects, agents, stats, loading } = useDashboard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [architectChatOpen, setArchitectChatOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ name: string; path: string } | null>(null);

  const handleSpeakToArchitect = (project: { name: string; path: string }) => {
    console.log(`Starting voice conversation for project: ${project.name}`);
    setSelectedProject(project);
    setArchitectChatOpen(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const remainingBudget = stats ? stats.monthlyBudget - stats.todayCost : 0;

  return (
    <main className="min-h-screen bg-background p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-16 h-16 flex items-center justify-center">
              <img
                src="/sentra-logo.png"
                alt="Sentra"
                className="w-16 h-16"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sentra</h1>
              <p className="text-sm text-muted-foreground">Mission Control for Your AI Agents</p>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-colors group"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Architect Chat Modal */}
      <ArchitectChat
        isOpen={architectChatOpen}
        onClose={() => setArchitectChatOpen(false)}
        projectName={selectedProject?.name || ''}
        projectPath={selectedProject?.path}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="sentra-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Active Agents</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">{stats?.activeAgents || 0}</p>
          <p className="text-xs text-green-400 mt-1">
            {stats?.activeAgents ? 'Running' : 'Idle'}
          </p>
        </div>

        <div className="sentra-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Projects</span>
            <Folder className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalProjects || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Tracked</p>
        </div>

        <div className="sentra-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Today's Cost</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">${stats?.todayCost.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${remainingBudget.toFixed(2)} remaining
          </p>
        </div>

        <div className="sentra-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold">{stats?.successRate || 0}%</p>
          <p className="text-xs text-green-400 mt-1">
            {stats && stats.successRate >= 90 ? '+2% this week' : 'Improving'}
          </p>
        </div>
      </div>

      {/* Active Agents */}
      <div className="sentra-card mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
        {agents.length === 0 ? (
          <div className="sentra-glass p-8 rounded-lg text-center">
            <p className="text-muted-foreground">No agents currently running</p>
            <p className="text-sm text-muted-foreground mt-2">
              Agents will appear here when processing GitHub issues
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
                  <span>{agent.elapsedMinutes}m elapsed</span>
                  <span>•</span>
                  <span>${agent.cost.toFixed(2)} spent</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="sentra-card">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {projects.length === 0 ? (
          <div className="sentra-glass p-8 rounded-lg text-center">
            <p className="text-muted-foreground">No projects configured</p>
            <p className="text-sm text-muted-foreground mt-2">
              Projects will appear here when configured in the system
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {projects.map((project) => (
              <div key={project.name} className="sentra-glass p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{project.name}</h3>

                    {/* Voice Conversation Button */}
                    <button
                      onClick={() => handleSpeakToArchitect({ name: project.name, path: project.path })}
                      className="group relative p-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 rounded-lg transition-all"
                      title="Speak to Architect about this project"
                    >
                      <div className="relative">
                        {/* Head Icon */}
                        <UserCircle className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />

                        {/* Microphone Badge */}
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <Mic className="w-3 h-3 text-violet-400 group-hover:text-violet-300 group-hover:scale-110 transition-all" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      project.status === 'active'
                        ? 'sentra-status-running'
                        : project.status === 'error'
                        ? 'sentra-status-error'
                        : 'sentra-status-idle'
                    }`}
                  >
                    {project.activeAgents > 0
                      ? `${project.activeAgents} active`
                      : project.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Issues: {project.totalIssues} total, {project.completedIssues} completed
                  </p>
                  <p>Cost: ${project.monthlyCost.toFixed(2)} this month</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
