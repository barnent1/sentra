'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export function NotificationCenter() {
  const { notifications, removeNotification } = useDashboardStore();

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2">
      <AnimatePresence>
        {notifications.slice(0, 5).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
              notification.priority === 'critical' && 'ring-2 ring-red-500'
            )}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={clsx(
                    'w-2 h-2 rounded-full mt-2',
                    notification.type === 'success' && 'bg-green-500',
                    notification.type === 'error' && 'bg-red-500',
                    notification.type === 'warning' && 'bg-yellow-500',
                    notification.type === 'info' && 'bg-blue-500'
                  )} />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}