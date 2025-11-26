'use client';

import { useState, useEffect } from 'react';
import { History, MessageSquare, Clock, ChevronRight, Plus } from 'lucide-react';
import type { ArchitectSession } from '@/db/schema';

interface SessionHistoryProps {
  projectId: string;
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

interface SessionWithProject extends ArchitectSession {
  projectName?: string;
}

export function SessionHistory({
  projectId,
  currentSessionId,
  onSelectSession,
  onNewSession,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [projectId]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/architect/sessions?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-violet-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        <p className="text-sm">{error}</p>
        <button
          onClick={loadSessions}
          className="mt-2 text-violet-400 hover:text-violet-300 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Session History</span>
        </div>
        <button
          onClick={onNewSession}
          className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
          title="New Session"
          aria-label="New session"
        >
          <Plus className="w-4 h-4 text-violet-400" />
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No previous sessions</p>
            <button
              onClick={onNewSession}
              className="mt-2 text-violet-400 hover:text-violet-300 text-sm"
            >
              Start a new session
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50" role="list">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full p-3 text-left hover:bg-slate-700/50 transition-colors ${
                    currentSessionId === session.id ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''
                  }`}
                  aria-current={currentSessionId === session.id ? 'true' : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Status indicator and timestamp */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`}
                          title={session.status}
                        />
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.lastActiveAt)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(session.overallProgress)} transition-all`}
                            style={{ width: `${session.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 min-w-[32px] text-right">
                          {Math.round(session.overallProgress)}%
                        </span>
                      </div>

                      {/* Status text */}
                      <p className="text-xs text-slate-500 mt-1 capitalize">
                        {session.status === 'completed'
                          ? 'Specification complete'
                          : session.status === 'paused'
                          ? 'In progress (paused)'
                          : 'Active session'}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
