'use client';

import { VoiceMeeting } from '@/types';

interface VoiceMeetingRoomProps {
  meeting: VoiceMeeting;
}

export function VoiceMeetingRoom({ meeting }: VoiceMeetingRoomProps) {
  return (
    <div className="h-full p-6 bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {meeting.title}
        </h2>
        <p className="text-gray-600 mb-8">
          Voice meeting functionality - Coming soon in full implementation
        </p>
        <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 bg-red-500 rounded-full recording-pulse" />
        </div>
      </div>
    </div>
  );
}