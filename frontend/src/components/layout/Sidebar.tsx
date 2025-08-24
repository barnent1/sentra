'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon,
  UsersIcon,
  MicrophoneIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore, useProjects } from '@/stores/dashboardStore';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { AgentStatusList } from '@/components/agents/AgentStatusList';
import clsx from 'clsx';

interface SidebarProps {
  collapsed: boolean;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'agents', label: 'Agents', icon: UsersIcon },
  { id: 'voice', label: 'Voice Meeting', icon: MicrophoneIcon },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const { activePanel, setActivePanel, toggleSidebar } = useDashboardStore();
  const projects = useProjects();

  return (
    <div className={clsx(
      'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
      collapsed ? 'w-16' : 'w-80'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sentra</h1>
                <p className="text-xs text-gray-500">Multi-Agent Dashboard</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Project Selector */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <ProjectSelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id as any)}
              className={clsx(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200',
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={clsx(
                'w-5 h-5',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Agent Status (when not collapsed) */}
      {!collapsed && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Active Agents</h3>
          <AgentStatusList compact />
        </div>
      )}
    </div>
  );
}