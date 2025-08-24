'use client';

import { motion } from 'framer-motion';
import { 
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Project } from '@/types';
import { AgentStatusList } from '@/components/agents/AgentStatusList';
import { formatDistanceToNow, format } from 'date-fns';

interface ProjectOverviewProps {
  project: Project;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const createdDate = format(new Date(project.createdAt), 'MMM dd, yyyy');
  const updatedAgo = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-xs text-gray-600">{createdDate}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-xs text-gray-600">{updatedAgo}</p>
              </div>
            </div>
          </div>

          {/* Task Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ChartBarIcon className="w-5 h-5 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Task Progress</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">
                  {project.metrics.tasksCompleted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress:</span>
                <span className="font-medium text-blue-600">
                  {project.metrics.tasksInProgress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">
                  {project.metrics.tasksTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium text-red-600">
                  {project.metrics.tasksFailed}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Performance</h4>
            
            {/* Lead Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lead Time</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(project.metrics.leadTime / 10 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {project.metrics.leadTime}d
                </span>
              </div>
            </div>

            {/* Cycle Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cycle Time</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(project.metrics.cycleTime / 5 * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {project.metrics.cycleTime}d
                </span>
              </div>
            </div>

            {/* Change Failure Rate */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failure Rate</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full"
                    style={{ width: `${project.metrics.changeFailureRate * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {(project.metrics.changeFailureRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <UserIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Assigned Agents</h3>
        </div>
        
        <AgentStatusList agents={project.agents} />
      </div>
    </div>
  );
}