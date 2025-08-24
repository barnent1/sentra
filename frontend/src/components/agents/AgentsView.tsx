'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAgents, useSelectedProject } from '@/stores/dashboardStore';
import { AgentCard } from './AgentCard';
import { AgentConversationPanel } from './AgentConversationPanel';
import { CodeDiffPanel } from './CodeDiffPanel';
import { Agent } from '@/types';

const filterOptions = [
  { value: 'all', label: 'All Agents' },
  { value: 'online', label: 'Online' },
  { value: 'busy', label: 'Busy' },
  { value: 'idle', label: 'Idle' },
  { value: 'error', label: 'Error' },
];

export function AgentsView() {
  const agents = useAgents();
  const selectedProject = useSelectedProject();
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'code'>('overview');

  // Filter agents based on selected project and status filter
  const filteredAgents = agents.filter(agent => {
    const matchesProject = !selectedProject || selectedProject.agents.some(a => a.id === agent.id);
    const matchesFilter = filter === 'all' || agent.status === filter;
    return matchesProject && matchesFilter;
  });

  const tabs = [
    { id: 'overview', label: 'Agent Overview', icon: UsersIcon },
    { id: 'conversations', label: 'Conversations', icon: ChatBubbleLeftRightIcon },
    { id: 'code', label: 'Code Changes', icon: CodeBracketIcon },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage your AI agents in real-time
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">
                  {agents.filter(a => a.status === 'online' || a.status === 'busy').length} Active
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-600">
                  {agents.filter(a => a.status === 'error').length} Error
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AgentCard agent={agent} />
                </motion.div>
              ))}
            </div>
            
            {filteredAgents.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'all' 
                      ? 'No agents are currently available.' 
                      : `No agents with status "${filter}" found.`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <AgentConversationPanel />
        )}

        {activeTab === 'code' && (
          <CodeDiffPanel />
        )}
      </div>
    </div>
  );
}