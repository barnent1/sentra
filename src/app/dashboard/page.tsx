'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { DeleteRunnerModal } from '@/components/DeleteRunnerModal';

interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  settings?: {
    lastActivity?: string;
  };
}

interface Runner {
  id: string;
  name: string;
  status: string;
  provider: string;
  region: string;
  ipAddress?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [runnerToDelete, setRunnerToDelete] = useState<Runner | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch projects and runners in parallel
      const [projectsRes, runnersRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/runners', { headers }),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (runnersRes.ok) {
        const runnersData = await runnersRes.json();
        setRunners(runnersData.runners || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (runner: Runner) => {
    setRunnerToDelete(runner);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRunnerToDelete(null);
  };

  const handleDeleteRunner = async (runnerId: string) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/runners/${runnerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete runner');
    }

    setRunners(runners.filter(r => r.id !== runnerId));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeRunners = runners.filter(r => r.status === 'active');
  const hasSetupRunner = runners.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="border-b border-[#27272A] bg-[#18181B]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/quetrex-logo.png"
              alt="Quetrex"
              width={40}
              height={40}
            />
            <h1 className="text-xl font-bold text-white">Quetrex</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user.name || 'there'}
          </h2>
          <p className="text-gray-400 mt-1">
            Manage your AI-powered development projects
          </p>
        </div>

        {/* Runner status alert */}
        {!hasSetupRunner && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-yellow-400 font-medium">No runner configured</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Set up a runner to execute AI agents on your projects.
                </p>
                <Link
                  href="/setup/runner"
                  className="inline-block mt-3 text-sm text-violet-400 hover:text-violet-300"
                >
                  Set up runner →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-white">{projects.length}</div>
            <div className="text-gray-400 text-sm mt-1">Projects</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-white">{activeRunners.length}</div>
            <div className="text-gray-400 text-sm mt-1">Active Runners</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-violet-400">Free</div>
            <div className="text-gray-400 text-sm mt-1">Plan</div>
          </div>
        </div>

        {/* Projects section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Projects</h3>
          </div>

          {projects.length === 0 ? (
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-[#27272A] rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h4 className="text-white font-medium mb-2">No projects yet</h4>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Install the Quetrex CLI and initialize your first project.
              </p>
              <div className="bg-[#0A0A0B] rounded-lg p-4 max-w-lg mx-auto text-left space-y-4">
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 1: Install Quetrex CLI</p>
                  <code className="text-violet-400 font-mono text-sm">curl -fsSL https://quetrex.com/install.sh | bash</code>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 2: Login to your account</p>
                  <code className="text-violet-400 font-mono text-sm">quetrex login</code>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 3: Initialize in your project</p>
                  <code className="text-violet-400 font-mono text-sm">cd your-project && quetrex init</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-lg p-6 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium">{project.name}</h4>
                      <p className="text-gray-500 text-sm font-mono mt-1">{project.path}</p>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Added {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Runners section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Runners</h3>
            {hasSetupRunner && (
              <Link
                href="/setup/runner"
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                Add runner
              </Link>
            )}
          </div>

          {runners.length === 0 ? (
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 text-center">
              <p className="text-gray-400">No runners configured</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {runners.map((runner) => (
                <div
                  key={runner.id}
                  className="bg-[#18181B] border border-[#27272A] rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          runner.status === 'active'
                            ? 'bg-green-500'
                            : runner.status === 'provisioning'
                            ? 'bg-yellow-500 animate-pulse'
                            : runner.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <h4 className="text-white font-medium">{runner.name}</h4>
                        <p className="text-gray-500 text-sm">
                          {runner.provider} · {runner.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          runner.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : runner.status === 'provisioning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : runner.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {runner.status}
                      </span>
                      <button
                        onClick={() => openDeleteModal(runner)}
                        className="text-gray-500 hover:text-red-400 transition"
                        title="Delete runner"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Runner Modal */}
      <DeleteRunnerModal
        isOpen={isDeleteModalOpen}
        runner={runnerToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteRunner}
      />
    </div>
  );
}
