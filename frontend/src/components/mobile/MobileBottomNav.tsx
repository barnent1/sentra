'use client';

import { 
  HomeIcon,
  UsersIcon,
  MicrophoneIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  MicrophoneIcon as MicrophoneIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';
import { useDashboardStore } from '@/stores/dashboardStore';
import clsx from 'clsx';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { id: 'agents', label: 'Agents', icon: UsersIcon, iconSolid: UsersIconSolid },
  { id: 'voice', label: 'Voice', icon: MicrophoneIcon, iconSolid: MicrophoneIconSolid },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
];

export function MobileBottomNav() {
  const { activePanel, setActivePanel, voiceMeetingActive } = useDashboardStore();

  return (
    <div className="mobile-bottom-nav bg-white border-t border-gray-200">
      <nav className="flex justify-around">
        {navigation.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id as any)}
              className={clsx(
                'flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.id === 'voice' && voiceMeetingActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}