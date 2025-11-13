"use client";

import { useState, useEffect } from "react";
import { Activity, Folder, DollarSign, TrendingUp, ExternalLink, X, Power } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface Stats {
  activeAgents: number;
  totalProjects: number;
  todayCost: number;
  successRate: number;
  monthlyBudget: number;
}

export default function MenubarPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const dashboardStats = await invoke<Stats>("get_dashboard_stats");
      setStats(dashboardStats);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load stats:", error);
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      await invoke("show_main_window");
    } catch (error) {
      console.error("Failed to open dashboard:", error);
    }
  };

  const handleQuit = async () => {
    try {
      await invoke("quit_app");
    } catch (error) {
      console.error("Failed to quit app:", error);
    }
  };

  const handleClose = async () => {
    try {
      await invoke("hide_menubar_window");
    } catch (error) {
      console.error("Failed to hide menubar window:", error);
    }
  };

  const remainingBudget = stats ? stats.monthlyBudget - stats.todayCost : 0;

  return (
    <div className="w-[320px] h-[420px] bg-[#18181B] border border-[#27272A] rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0A0A0B] px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img
              src="/sentra-logo.png"
              alt="Sentra"
              className="w-8 h-8"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#FAFAFA]">Sentra</h1>
            <p className="text-xs text-[#A1A1AA]">Quick Stats</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-[#27272A] rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 text-[#A1A1AA]" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-[#A1A1AA]">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Active Agents */}
              <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-violet-500" />
                  <span className="text-xs text-[#A1A1AA]">Agents</span>
                </div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.activeAgents || 0}</p>
                <p className="text-xs text-green-400 mt-0.5">
                  {stats?.activeAgents ? 'Running' : 'Idle'}
                </p>
              </div>

              {/* Projects */}
              <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-3 h-3 text-violet-500" />
                  <span className="text-xs text-[#A1A1AA]">Projects</span>
                </div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.totalProjects || 0}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Tracked</p>
              </div>

              {/* Today's Cost */}
              <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3 h-3 text-violet-500" />
                  <span className="text-xs text-[#A1A1AA]">Today</span>
                </div>
                <p className="text-2xl font-bold text-[#FAFAFA]">${stats?.todayCost.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  ${remainingBudget.toFixed(2)} left
                </p>
              </div>

              {/* Success Rate */}
              <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-violet-500" />
                  <span className="text-xs text-[#A1A1AA]">Success</span>
                </div>
                <p className="text-2xl font-bold text-[#FAFAFA]">{stats?.successRate || 0}%</p>
                <p className="text-xs text-green-400 mt-0.5">
                  {stats && stats.successRate >= 90 ? 'Great!' : 'Good'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {/* Open Dashboard */}
              <button
                onClick={handleOpenDashboard}
                className="w-full px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open Dashboard
              </button>

              {/* Quit */}
              <button
                onClick={handleQuit}
                className="w-full px-4 py-2 bg-[#0A0A0B] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Power className="w-4 h-4" />
                Quit Sentra
              </button>
            </div>

            {/* Footer Info */}
            <div className="pt-2 border-t border-[#27272A]">
              <p className="text-xs text-[#71717A] text-center">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
