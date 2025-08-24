'use client';

import { motion } from 'framer-motion';
import { Agent } from '@/types';
import clsx from 'clsx';

interface AgentStatusDotProps {
  status: Agent['status'];
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const statusConfig = {
  online: {
    className: 'bg-green-500',
    label: 'Online'
  },
  offline: {
    className: 'bg-gray-400',
    label: 'Offline'
  },
  busy: {
    className: 'bg-orange-500',
    label: 'Busy'
  },
  idle: {
    className: 'bg-blue-500',
    label: 'Idle'
  },
  error: {
    className: 'bg-red-500',
    label: 'Error'
  }
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export function AgentStatusDot({ 
  status, 
  size = 'md', 
  showPulse = true 
}: AgentStatusDotProps) {
  const config = statusConfig[status];
  const shouldPulse = showPulse && (status === 'online' || status === 'busy');

  return (
    <div className="relative flex items-center">
      <motion.div
        className={clsx(
          'rounded-full',
          config.className,
          sizeConfig[size]
        )}
        animate={shouldPulse ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1]
        } : undefined}
        transition={shouldPulse ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        } : undefined}
      />
      
      {shouldPulse && (
        <motion.div
          className={clsx(
            'absolute inset-0 rounded-full border-2 border-current opacity-20',
            config.className.replace('bg-', 'border-'),
            sizeConfig[size]
          )}
          animate={{
            scale: [1, 2],
            opacity: [0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      )}
    </div>
  );
}