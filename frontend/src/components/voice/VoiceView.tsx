'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/stores/dashboardStore';
import { VoiceMeetingSetup } from './VoiceMeetingSetup';
import { VoiceMeetingRoom } from './VoiceMeetingRoom';
import { MeetingHistory } from './MeetingHistory';
import { VoiceSettings } from './VoiceSettings';

const tabs = [
  { id: 'new-meeting', label: 'New Meeting', icon: MicrophoneIcon },
  { id: 'active-meeting', label: 'Active Meeting', icon: UserGroupIcon },
  { id: 'history', label: 'Meeting History', icon: DocumentTextIcon },
  { id: 'settings', label: 'Voice Settings', icon: Cog6ToothIcon },
];

export function VoiceView() {
  const { voiceMeetingActive, currentMeeting } = useDashboardStore();
  const [activeTab, setActiveTab] = useState(
    voiceMeetingActive ? 'active-meeting' : 'new-meeting'
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new-meeting':
        return <VoiceMeetingSetup />;
      case 'active-meeting':
        return voiceMeetingActive && currentMeeting ? 
          <VoiceMeetingRoom meeting={currentMeeting} /> : 
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active meeting</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start a new meeting to begin voice collaboration.
              </p>
            </div>
          </div>;
      case 'history':
        return <MeetingHistory />;
      case 'settings':
        return <VoiceSettings />;
      default:
        return <VoiceMeetingSetup />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Boardroom</h1>
            <p className="text-gray-600 mt-1">
              AI-powered voice collaboration for project planning and decision making
            </p>
          </div>
          
          {voiceMeetingActive && (
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full recording-pulse" />
                <span className="text-red-700 font-medium text-sm">Meeting in Progress</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <SpeakerWaveIcon className="w-4 h-4" />
                <span>{currentMeeting?.participants.length || 0} participants</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.id === 'active-meeting' && !voiceMeetingActive;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : isDisabled
                      ? 'border-transparent text-gray-300 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isDisabled ? 'text-gray-300' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'active-meeting' && voiceMeetingActive && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
}