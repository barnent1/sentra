'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Project, TimelineEvent } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface ActivityFeedProps {
  project: Project;
}

// Mock timeline events since the project timeline might be empty
const generateMockEvents = (projectId: string): TimelineEvent[] => [
  {
    id: '1',
    projectId,
    agentId: 'james-1',
    type: 'task_completed',
    title: 'Checkout flow implementation completed',
    description: 'Successfully implemented the complete checkout flow with payment integration',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    metadata: { duration: '2.5h', linesChanged: 247 }
  },
  {
    id: '2',
    projectId,
    agentId: 'sarah-1',
    type: 'agent_communication',
    title: 'API optimization discussion',
    description: 'Discussed database query optimization with James for better performance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    metadata: { participants: ['james-1', 'sarah-1'] }
  },
  {
    id: '3',
    projectId,
    agentId: 'james-1',
    type: 'code_change',
    title: 'UI components refactored',
    description: 'Refactored shared UI components to improve reusability and performance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    metadata: { filesChanged: 12, linesAdded: 156, linesRemoved: 89 }
  },
  {
    id: '4',
    projectId,
    agentId: 'sarah-1',
    type: 'deployment',
    title: 'Staging deployment successful',
    description: 'Deployed latest changes to staging environment for testing',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    metadata: { environment: 'staging', buildTime: '3m 24s' }
  },
  {
    id: '5',
    projectId,
    agentId: 'james-1',
    type: 'task_started',
    title: 'Started mobile responsive improvements',
    description: 'Beginning work on mobile responsive design improvements for the dashboard',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
  }
];

const eventIcons = {
  task_started: PlayIcon,
  task_completed: CheckCircleIcon,
  task_failed: XCircleIcon,
  milestone_reached: InformationCircleIcon,
  agent_communication: ChatBubbleLeftRightIcon,
  code_change: CodeBracketIcon,
  deployment: RocketLaunchIcon,
  meeting: UserGroupIcon,
  decision: ExclamationTriangleIcon,
};

const eventColors = {
  task_started: 'blue',
  task_completed: 'green',
  task_failed: 'red',
  milestone_reached: 'purple',
  agent_communication: 'orange',
  code_change: 'indigo',
  deployment: 'cyan',
  meeting: 'pink',
  decision: 'yellow',
};

const getColorClasses = (color: string) => {
  const colors = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', icon: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-100', icon: 'text-red-600', border: 'border-red-200' },
    purple: { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
    indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-200' },
    cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600', border: 'border-cyan-200' },
    pink: { bg: 'bg-pink-100', icon: 'text-pink-600', border: 'border-pink-200' },
    yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600', border: 'border-yellow-200' },
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export function ActivityFeed({ project }: ActivityFeedProps) {
  // Use mock data if no timeline events exist
  const events = project.timeline.length > 0 ? project.timeline : generateMockEvents(project.id);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {events.slice(0, 10).map((event, index) => {
          const Icon = eventIcons[event.type] || InformationCircleIcon;
          const color = eventColors[event.type] || 'blue';
          const colors = getColorClasses(color);
          const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex space-x-3"
            >
              <div className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border',
                colors.bg,
                colors.border
              )}>
                <Icon className={clsx('w-4 h-4', colors.icon)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <time className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {timeAgo}
                  </time>
                </div>
                
                {event.metadata && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.metadata.duration && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {event.metadata.duration}
                      </span>
                    )}
                    {event.metadata.linesChanged && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {event.metadata.linesChanged} lines
                      </span>
                    )}
                    {event.metadata.filesChanged && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {event.metadata.filesChanged} files
                      </span>
                    )}
                    {event.metadata.environment && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {event.metadata.environment}
                      </span>
                    )}
                  </div>
                )}
                
                {index < events.slice(0, 10).length - 1 && (
                  <div className="mt-4 border-l border-gray-200 ml-4 pl-4">
                    <div className="h-4" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {events.length > 10 && (
          <div className="text-center pt-4">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all activity ({events.length} total)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}