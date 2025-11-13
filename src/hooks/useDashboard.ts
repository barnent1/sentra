import { useState, useEffect } from 'react';
import {
  getProjects,
  getActiveAgents,
  getDashboardStats,
  type Project,
  type Agent,
  type DashboardStats,
} from '@/lib/tauri';

export function useDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      // Fetch data
      const [projectsData, agentsData, statsData] = await Promise.all([
        getProjects(),
        getActiveAgents(),
        getDashboardStats(),
      ]);

      setProjects(projectsData);
      setAgents(agentsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    }
  }

  const refetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    let unlistenProjects: (() => void) | null = null;
    let unlistenAgents: (() => void) | null = null;
    let unlistenStats: (() => void) | null = null;

    async function setupEventListeners() {
      try {
        setLoading(true);

        // Initial data fetch
        await fetchData();
        setLoading(false);

        // Only set up event listeners in Tauri environment
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const { listen } = await import('@tauri-apps/api/event');

          // Listen for reactive updates from backend
          unlistenProjects = await listen<Project[]>('projects-updated', (event) => {
            console.log('🔄 Received projects update');
            setProjects(event.payload);
          });

          unlistenAgents = await listen<Agent[]>('agents-updated', (event) => {
            console.log('🔄 Received agents update');
            setAgents(event.payload);
          });

          unlistenStats = await listen<DashboardStats>('stats-updated', (event) => {
            console.log('🔄 Received stats update');
            setStats(event.payload);
          });

          console.log('✅ Event listeners registered');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        setLoading(false);
      }
    }

    setupEventListeners();

    // Cleanup event listeners on unmount
    return () => {
      if (unlistenProjects) unlistenProjects();
      if (unlistenAgents) unlistenAgents();
      if (unlistenStats) unlistenStats();
    };
  }, []);

  return { projects, agents, stats, loading, error, refetch };
}
