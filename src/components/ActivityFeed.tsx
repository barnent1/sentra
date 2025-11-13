"use client";

import { useState, useEffect, useRef } from 'react';
import { GitCommit, Play, CheckCircle, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { getActivityEvents, type ActivityEvent } from '@/lib/tauri';

interface ActivityFeedProps {
  project?: string;
  showFilter?: boolean;
  limit?: number;
}

export function ActivityFeed({ project, showFilter = false, limit = 50 }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(project);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch activity events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActivityEvents(limit, selectedProject);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [selectedProject, limit]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedProject, limit]);

  // Update selected project when prop changes
  useEffect(() => {
    setSelectedProject(project);
  }, [project]);

  // Get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-blue-400" data-testid="event-icon" />;
      case 'agent_start':
        return <Play className="w-4 h-4 text-green-400" data-testid="event-icon" />;
      case 'agent_complete':
        return <CheckCircle className="w-4 h-4 text-green-400" data-testid="event-icon" />;
      case 'build':
        return <Wrench className="w-4 h-4 text-violet-400" data-testid="event-icon" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" data-testid="event-icon" />;
      default:
        return <GitCommit className="w-4 h-4 text-gray-400" data-testid="event-icon" />;
    }
  };

  // Format timestamp to relative time or absolute time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    // Show relative time for recent events (< 1 hour)
    if (diffMins < 1) {
      return '< 1 min';
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    // Show absolute time for older events
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Get unique projects from events
  const projects = Array.from(new Set(events.map((e) => e.project)));

  return (
    <div
      data-testid="activity-feed"
      className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 h-full flex flex-col"
      role="region"
      aria-label="Activity Feed"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#FAFAFA]">Recent Activity</h2>
        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            data-testid="auto-scroll-toggle"
            onClick={() => setAutoScroll(!autoScroll)}
            aria-pressed={autoScroll}
            className={`p-1.5 rounded ${
              autoScroll
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-[#27272A] text-[#A1A1AA]'
            } hover:bg-violet-500/30 transition-colors`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Refresh button */}
          <button
            data-testid="refresh-button"
            onClick={fetchEvents}
            className="p-1.5 rounded bg-[#27272A] text-[#A1A1AA] hover:bg-violet-500/20 hover:text-violet-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project filter */}
      {showFilter && (
        <div className="mb-4">
          <select
            data-testid="project-filter"
            value={selectedProject || 'all'}
            onChange={(e) => setSelectedProject(e.target.value === 'all' ? undefined : e.target.value)}
            className="w-full px-3 py-2 bg-[#27272A] border border-[#3f3f46] rounded text-[#FAFAFA] text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Projects</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Events container */}
      <div
        ref={containerRef}
        data-testid="activity-feed-container"
        data-auto-scroll={autoScroll}
        aria-live="polite"
        className="flex-1 overflow-y-auto space-y-3"
      >
        {loading && (
          <div data-testid="activity-feed-loading" className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-3">{error}</p>
            <button
              data-testid="retry-button"
              onClick={fetchEvents}
              className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-8 text-[#A1A1AA]">
            No recent activity
          </div>
        )}

        {!loading && !error && events.map((event, index) => (
          <div
            key={event.id}
            data-testid={`activity-event-${event.id}`}
            data-event-type={event.type}
            className="relative flex gap-3 pb-3"
          >
            {/* Timeline connector */}
            {index < events.length - 1 && (
              <div
                data-testid="timeline-connector"
                className="absolute left-2 top-6 bottom-0 w-0.5 bg-[#27272A]"
              />
            )}

            {/* Event icon */}
            <div className="flex-shrink-0 w-4 h-4 mt-0.5 relative z-10">
              {getEventIcon(event.type)}
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#FAFAFA] break-words">
                    {event.message}
                  </p>
                  <p className="text-xs text-violet-400 mt-0.5">
                    {event.project}
                  </p>
                </div>
                <span
                  data-testid={`event-timestamp-${event.id}`}
                  className="text-xs text-[#A1A1AA] whitespace-nowrap flex-shrink-0"
                >
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Bottom ref for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
