'use client';

import { Project } from '@/types';
import clsx from 'clsx';

interface ProjectStatusBadgeProps {
  status: Project['status'];
  size?: 'xs' | 'sm' | 'md';
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
    dotClassName: 'bg-green-500'
  },
  paused: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dotClassName: 'bg-yellow-500'
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClassName: 'bg-blue-500'
  },
  planning: {
    label: 'Planning',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClassName: 'bg-purple-500'
  }
};

const sizeConfig = {
  xs: {
    containerClass: 'px-2 py-0.5 text-xs',
    dotClass: 'w-1.5 h-1.5'
  },
  sm: {
    containerClass: 'px-2.5 py-1 text-xs',
    dotClass: 'w-2 h-2'
  },
  md: {
    containerClass: 'px-3 py-1.5 text-sm',
    dotClass: 'w-2.5 h-2.5'
  }
};

export function ProjectStatusBadge({ status, size = 'sm' }: ProjectStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <div className={clsx(
      'inline-flex items-center space-x-1.5 rounded-full border font-medium',
      config.className,
      sizeStyles.containerClass
    )}>
      <div className={clsx(
        'rounded-full',
        config.dotClassName,
        sizeStyles.dotClass,
        status === 'active' && 'animate-pulse'
      )} />
      <span>{config.label}</span>
    </div>
  );
}