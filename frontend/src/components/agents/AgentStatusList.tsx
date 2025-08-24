'use client';

import { motion } from 'framer-motion';
import { Agent } from '@/types';
import { useSelectedProject } from '@/stores/dashboardStore';
import { AgentStatusDot } from './AgentStatusDot';
import clsx from 'clsx';

interface AgentStatusListProps {
  compact?: boolean;
  agents?: Agent[];
}

export function AgentStatusList({ compact = false, agents: propAgents }: AgentStatusListProps) {
  const selectedProject = useSelectedProject();
  const agents = propAgents || (selectedProject?.agents || []);

  if (agents.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 py-4">
        No agents assigned
      </div>
    );
  }

  return (
    <div className={clsx(
      'space-y-2',
      compact ? 'space-y-1.5' : 'space-y-3'
    )}>
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={clsx(
            'flex items-center space-x-3 p-2 rounded-lg transition-colors',
            compact 
              ? 'hover:bg-gray-50' 
              : 'bg-white border border-gray-200 hover:border-gray-300'
          )}
        >
          <AgentStatusDot 
            status={agent.status} 
            size={compact ? 'sm' : 'md'} 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className={clsx(
                'font-medium text-gray-900 truncate',
                compact ? 'text-sm' : 'text-base'
              )}>
                {agent.name}
              </p>
              <span className={clsx(
                'text-gray-500 capitalize',
                compact ? 'text-xs' : 'text-sm'
              )}>
                ({agent.type})
              </span>
            </div>
            
            {agent.currentTask && (
              <p className={clsx(
                'text-gray-600 truncate mt-0.5',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {agent.currentTask}
              </p>
            )}
            
            {!compact && agent.performance && (
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-500">
                    {agent.performance.successRate}% success
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs text-gray-500">
                    {agent.performance.tasksCompleted} tasks
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-xs text-gray-500">
                    {agent.performance.averageTaskTime}h avg
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {!compact && agent.health && (
            <div className="text-right">
              <div className={clsx(
                'text-xs font-medium',
                agent.health.status === 'healthy' ? 'text-green-600' :
                agent.health.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              )}>
                {agent.health.uptime.toFixed(1)}% uptime
              </div>
              <div className="text-xs text-gray-500">
                {agent.health.memoryUsage}% memory
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}