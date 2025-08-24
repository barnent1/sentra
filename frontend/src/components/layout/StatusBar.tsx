'use client';

import { motion } from 'framer-motion';
import { 
  WifiIcon,
  SignalIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  WifiIcon as WifiIconSolid,
  MicrophoneIcon as MicrophoneIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid
} from '@heroicons/react/24/solid';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ttsService } from '@/utils/ttsService';
import clsx from 'clsx';

export function StatusBar() {
  const { 
    wsConnected, 
    wsReconnecting, 
    voiceMeetingActive, 
    ttsConfig, 
    updateTTSConfig,
    notifications 
  } = useDashboardStore();

  const unreadCount = notifications.filter(n => !n.ttsEnabled).length;
  const criticalAlerts = notifications.filter(n => n.priority === 'critical').length;

  const toggleTTS = () => {
    updateTTSConfig({ enabled: !ttsConfig.enabled });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      {/* Left Section - Connection Status */}
      <div className="flex items-center space-x-4">
        {/* WebSocket Status */}
        <div className="flex items-center space-x-2">
          {wsConnected ? (
            <WifiIconSolid className="w-4 h-4 text-green-500" />
          ) : wsReconnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <WifiIcon className="w-4 h-4 text-orange-500" />
            </motion.div>
          ) : (
            <WifiIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={clsx(
            'text-xs font-medium',
            wsConnected ? 'text-green-600' : wsReconnecting ? 'text-orange-600' : 'text-red-600'
          )}>
            {wsConnected ? 'Connected' : wsReconnecting ? 'Reconnecting...' : 'Offline'}
          </span>
        </div>

        {/* Signal Strength */}
        <div className="flex items-center space-x-1">
          <SignalIcon className="w-4 h-4 text-gray-400" />
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map(bar => (
              <div
                key={bar}
                className={clsx(
                  'w-1 rounded-full transition-colors duration-200',
                  bar <= (wsConnected ? 4 : wsReconnecting ? 2 : 1) 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                )}
                style={{ height: `${bar * 3 + 4}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Section - System Status */}
      <div className="hidden md:flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-600">All Systems Operational</span>
        </div>
        
        {voiceMeetingActive && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full"
          >
            <div className="w-2 h-2 bg-red-500 rounded-full recording-pulse" />
            <span className="text-red-700 font-medium">Voice Meeting Active</span>
          </motion.div>
        )}
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <button className="relative p-1 hover:bg-gray-100 rounded-md transition-colors">
          <BellIcon className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </button>

        {/* Critical Alerts */}
        {criticalAlerts > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative p-1 hover:bg-red-50 rounded-md transition-colors"
          >
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {criticalAlerts}
            </div>
          </motion.button>
        )}

        {/* Voice Meeting Toggle */}
        <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
          {voiceMeetingActive ? (
            <MicrophoneIconSolid className="w-5 h-5 text-red-500" />
          ) : (
            <MicrophoneIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* TTS Toggle */}
        <button 
          onClick={toggleTTS}
          className={clsx(
            'p-1 rounded-md transition-colors',
            ttsConfig.enabled 
              ? 'bg-blue-50 hover:bg-blue-100' 
              : 'hover:bg-gray-100'
          )}
        >
          {ttsConfig.enabled ? (
            <SpeakerWaveIconSolid className="w-5 h-5 text-blue-500" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Device Info */}
        <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
          <span>{ttsService.getDeviceInfo().type}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>{ttsService.getDeviceInfo().os}</span>
        </div>
      </div>
    </div>
  );
}