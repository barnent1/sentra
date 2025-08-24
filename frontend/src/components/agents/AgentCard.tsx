'use client';

import { motion } from 'framer-motion';
import { 
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { Agent } from '@/types';
import { AgentStatusDot } from './AgentStatusDot';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface AgentCardProps {
  agent: Agent;
}

const agentTypeLabels = {
  james: 'Frontend Developer',
  sarah: 'Backend Developer', 
  mike: 'Project Manager',
  'performance-optimizer': 'Performance Expert',
  'security-scanner': 'Security Specialist',
  'test-automator': 'Test Engineer',
  'quality-enforcer': 'Quality Assurance',
  'deployment-manager': 'DevOps Engineer',
  'code-reviewer': 'Code Reviewer',
  'code-analyzer': 'Code Analyst',
  'documentation-generator': 'Documentation Writer'
};

const getHealthColor = (status: Agent['health']['status']) => {
  switch (status) {
    case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function AgentCard({ agent }: AgentCardProps) {
  const lastActivity = formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true });
  const agentLabel = agentTypeLabels[agent.type] || agent.type;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {agent.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1">
                <AgentStatusDot status={agent.status} size="sm" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
              <p className="text-sm text-gray-600">{agentLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Active {lastActivity}
              </p>
            </div>
          </div>

          <div className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium border',
            getHealthColor(agent.health.status)
          )}>
            {agent.health.status}
          </div>
        </div>

        {/* Current Task */}
        {agent.currentTask && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Current Task</span>
            </div>
            <p className="text-sm text-blue-800 mt-1">{agent.currentTask}</p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {agent.performance.successRate}%
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {agent.performance.tasksCompleted}
            </div>
            <div className="text-xs text-gray-600">Tasks Done</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {agent.performance.averageTaskTime}h
            </div>
            <div className="text-xs text-gray-600">Avg Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {agent.performance.efficiency}%
            </div>
            <div className="text-xs text-gray-600">Efficiency</div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <CpuChipIcon className="w-4 h-4" />
          <span>System Health</span>
        </h4>
        
        <div className="space-y-3">
          {/* Memory Usage */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Memory</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <motion.div
                  className={clsx(
                    'h-1.5 rounded-full',
                    agent.health.memoryUsage > 80 ? 'bg-red-500' :
                    agent.health.memoryUsage > 60 ? 'bg-yellow-500' :
                    'bg-green-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.health.memoryUsage}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-8">
                {agent.health.memoryUsage}%
              </span>
            </div>
          </div>

          {/* CPU Usage */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CPU</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <motion.div
                  className={clsx(
                    'h-1.5 rounded-full',
                    agent.health.cpuUsage > 80 ? 'bg-red-500' :
                    agent.health.cpuUsage > 60 ? 'bg-yellow-500' :
                    'bg-green-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.health.cpuUsage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-8">
                {agent.health.cpuUsage}%
              </span>
            </div>
          </div>

          {/* Uptime */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Uptime</span>
            <div className="flex items-center space-x-1">
              <SignalIcon className="w-3 h-3 text-green-500" />
              <span className="text-sm font-medium text-gray-900">
                {agent.health.uptime.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Capabilities</h4>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 4).map((capability) => (
            <span
              key={capability}
              className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded-md border border-gray-200"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="px-2 py-1 bg-gray-200 text-xs font-medium text-gray-600 rounded-md">
              +{agent.capabilities.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}