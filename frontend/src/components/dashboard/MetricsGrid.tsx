'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  RocketLaunchIcon,
  BugAntIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Project } from '@/types';
import { CircularProgress } from './CircularProgress';

interface MetricsGridProps {
  project: Project;
}

const metrics = [
  {
    key: 'codeQuality',
    label: 'Code Quality',
    icon: ShieldCheckIcon,
    color: 'blue',
    suffix: '%'
  },
  {
    key: 'testCoverage',
    label: 'Test Coverage',
    icon: CheckCircleIcon,
    color: 'green',
    suffix: '%'
  },
  {
    key: 'deploymentFrequency',
    label: 'Deployments',
    icon: RocketLaunchIcon,
    color: 'purple',
    suffix: '/week'
  },
  {
    key: 'meanTimeToRecovery',
    label: 'MTTR',
    icon: ExclamationTriangleIcon,
    color: 'orange',
    suffix: 'h'
  }
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: 'text-orange-500'
    }
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export function MetricsGrid({ project }: MetricsGridProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const value = project.metrics[metric.key as keyof typeof project.metrics];
          const colors = getColorClasses(metric.color);
          const Icon = metric.icon;
          
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} rounded-lg p-4 border border-gray-100`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
                {(metric.key === 'codeQuality' || metric.key === 'testCoverage') && (
                  <CircularProgress 
                    progress={value as number} 
                    size={24}
                    strokeWidth={2}
                  />
                )}
              </div>
              
              <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                {value}{metric.suffix}
              </div>
              
              <div className="text-xs text-gray-600">
                {metric.label}
              </div>
              
              {/* Trend indicator (mock data) */}
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-green-600">+2.3%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">DevOps Metrics</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lead Time</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((10 - project.metrics.leadTime) / 10 * 100, 100)}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-12">
                {project.metrics.leadTime}d
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cycle Time</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-green-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((5 - project.metrics.cycleTime) / 5 * 100, 100)}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-12">
                {project.metrics.cycleTime}d
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Change Failure Rate</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-red-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.metrics.changeFailureRate * 100}%` }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 min-w-12">
                {(project.metrics.changeFailureRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}