'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export function CircularProgress({ 
  progress, 
  size = 40, 
  strokeWidth = 4,
  className = '',
  showText = false
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const strokeDasharray = useMemo(() => circumference, [circumference]);
  const strokeDashoffset = useMemo(() => 
    circumference - (progress / 100) * circumference,
    [circumference, progress]
  );

  const getColor = (progress: number) => {
    if (progress >= 80) return '#10b981'; // green-500
    if (progress >= 50) return '#3b82f6'; // blue-500
    if (progress >= 25) return '#f59e0b'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(progress)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-xs font-semibold"
            style={{ color: getColor(progress) }}
          >
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}