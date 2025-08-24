'use client';

import { motion } from 'framer-motion';
import { useProjects, useSelectedProject } from '@/stores/dashboardStore';
import { ProjectCard } from './ProjectCard';
import { ProjectOverview } from './ProjectOverview';
import { ActivityFeed } from './ActivityFeed';
import { MetricsGrid } from './MetricsGrid';
import { useWindowSize } from '@/hooks/useWindowSize';

export function DashboardView() {
  const projects = useProjects();
  const selectedProject = useSelectedProject();
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor your multi-agent development projects in real-time
            </p>
          </div>
          
          {!isMobile && (
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-600">
                  {projects.filter(p => p.status === 'active').length} Active Projects
                </span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  {projects.reduce((sum, p) => sum + p.agents.length, 0)} Agents
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard 
                project={project} 
                isSelected={selectedProject?.id === project.id} 
              />
            </motion.div>
          ))}
        </div>

        {/* Selected Project Details */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedProject.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedProject.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {/* Project Overview */}
              <div className="lg:col-span-1">
                <ProjectOverview project={selectedProject} />
              </div>
              
              {/* Metrics */}
              <div className="lg:col-span-1">
                <MetricsGrid project={selectedProject} />
              </div>
              
              {/* Activity Feed */}
              <div className="lg:col-span-1 xl:col-span-1">
                <ActivityFeed project={selectedProject} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        {!selectedProject && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {projects.length}
              </div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {projects.reduce((sum, p) => sum + p.agents.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}