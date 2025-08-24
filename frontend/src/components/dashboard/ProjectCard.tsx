'use client';

import { motion } from 'framer-motion';
import { 
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Project } from '@/types';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { AgentStatusDot } from '@/components/agents/AgentStatusDot';
import { CircularProgress } from './CircularProgress';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
}

const statusIcons = {
  active: PlayIcon,
  paused: PauseIcon,
  completed: CheckCircleIcon,
  planning: ClockIcon,
};

export function ProjectCard({ project, isSelected }: ProjectCardProps) {
  const { setSelectedProject } = useDashboardStore();
  const StatusIcon = statusIcons[project.status];

  const handleClick = () => {
    setSelectedProject(project.id);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-500';
    if (progress >= 50) return 'text-blue-500';
    if (progress >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const activeAgents = project.agents.filter(a => a.status === 'online' || a.status === 'busy');
  const lastUpdate = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true });

  return (
    <motion.div
      onClick={handleClick}
      className={clsx(
        'bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        isSelected 
          ? 'border-blue-500 shadow-lg ring-4 ring-blue-100' 
          : 'border-gray-200 hover:border-gray-300'
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              project.status === 'active' ? 'bg-green-100' :
              project.status === 'completed' ? 'bg-blue-100' :
              project.status === 'paused' ? 'bg-yellow-100' :
              'bg-purple-100'
            )}>
              <StatusIcon className={clsx(
                'w-5 h-5',
                project.status === 'active' ? 'text-green-600' :
                project.status === 'completed' ? 'text-blue-600' :
                project.status === 'paused' ? 'text-yellow-600' :
                'text-purple-600'
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                {project.description}
              </p>
            </div>
          </div>
          
          <ProjectStatusBadge status={project.status} size="sm" />
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={clsx('text-sm font-bold', getProgressColor(project.progress))}>
            {project.progress}%
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={clsx(
                  'h-2 rounded-full',
                  project.progress >= 80 ? 'bg-green-500' :
                  project.progress >= 50 ? 'bg-blue-500' :
                  project.progress >= 25 ? 'bg-orange-500' :
                  'bg-red-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
          
          <CircularProgress 
            progress={project.progress} 
            size={32}
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Agents Section */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UsersIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {project.agents.length} agent{project.agents.length !== 1 ? 's' : ''}
            </span>
            {activeAgents.length > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-green-600">
                  {activeAgents.length} active
                </span>
              </>
            )}
          </div>
        </div>

        {project.agents.length > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            {project.agents.slice(0, 5).map((agent) => (
              <div key={agent.id} className="flex items-center space-x-1">
                <AgentStatusDot status={agent.status} size="sm" />
                <span className="text-xs text-gray-600 truncate max-w-16">
                  {agent.name}
                </span>
              </div>
            ))}
            {project.agents.length > 5 && (
              <span className="text-xs text-gray-400">
                +{project.agents.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics Section */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {project.metrics.tasksCompleted}
            </div>
            <div className="text-xs text-gray-500">Tasks Done</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {project.metrics.codeQuality}%
            </div>
            <div className="text-xs text-gray-500">Quality</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {project.metrics.testCoverage}%
            </div>
            <div className="text-xs text-gray-500">Coverage</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-3 h-3" />
            <span>Updated {lastUpdate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChartBarIcon className="w-3 h-3" />
            <span>{project.metrics.tasksInProgress} in progress</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}