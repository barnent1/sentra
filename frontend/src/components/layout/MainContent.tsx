'use client';

import { useDashboardStore } from '@/stores/dashboardStore';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { AgentsView } from '@/components/agents/AgentsView';
import { VoiceView } from '@/components/voice/VoiceView';
import { SettingsView } from '@/components/settings/SettingsView';

export function MainContent() {
  const { activePanel } = useDashboardStore();

  const renderContent = () => {
    switch (activePanel) {
      case 'dashboard':
        return <DashboardView />;
      case 'agents':
        return <AgentsView />;
      case 'voice':
        return <VoiceView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {renderContent()}
    </div>
  );
}