'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Globe, 
  Settings, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Eye,
  GitBranch,
  Activity,
  BarChart3,
  Shield,
  Plus,
  Trash2
} from 'lucide-react';
import {
  VercelIntegration,
  Deployment,
  DeploymentConfig,
  VercelEnvironment,
  EnvironmentVariable
} from '../../types';

interface VercelIntegrationViewProps {
  projectId: string;
  integration?: VercelIntegration;
  onConfigurationChange: (config: Partial<VercelIntegration>) => void;
}

const VercelIntegrationView: React.FC<VercelIntegrationViewProps> = ({
  projectId,
  integration,
  onConfigurationChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'environments' | 'config'>('overview');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    installCommand: 'npm install',
    devCommand: 'npm run dev',
    framework: 'nextjs',
    nodeVersion: '18.x',
    environmentVariables: []
  });
  const [environments, setEnvironments] = useState<VercelEnvironment[]>([
    {
      name: 'production',
      url: 'https://sentra-dashboard.vercel.app',
      branch: 'main',
      autoDeployEnabled: true,
      protectionBypass: false
    },
    {
      name: 'preview',
      url: 'https://sentra-dashboard-git-develop.vercel.app',
      branch: 'develop',
      autoDeployEnabled: true,
      protectionBypass: false
    },
    {
      name: 'development',
      autoDeployEnabled: false,
      protectionBypass: false
    }
  ]);

  const [newEnvVar, setNewEnvVar] = useState<Partial<EnvironmentVariable>>({
    key: '',
    value: '',
    target: ['development'],
    type: 'plain'
  });

  useEffect(() => {
    // Load integration data
    if (integration) {
      setDeploymentConfig(integration.deploymentConfig);
      setEnvironments(integration.environments);
    }

    // Mock deployment data
    setDeployments([
      {
        id: '1',
        projectId,
        url: 'https://sentra-dashboard-git-feature-auth.vercel.app',
        environment: 'preview',
        state: 'READY',
        type: 'LAMBDAS',
        createdAt: '2024-01-15T10:00:00Z',
        buildingAt: '2024-01-15T10:00:30Z',
        readyAt: '2024-01-15T10:03:45Z',
        source: 'git',
        target: 'feature/auth-module',
        gitSource: {
          type: 'github',
          repo: 'sentra-project',
          ref: 'feature/auth-module',
          sha: 'abc123def456'
        }
      },
      {
        id: '2',
        projectId,
        url: 'https://sentra-dashboard.vercel.app',
        environment: 'production',
        state: 'READY',
        type: 'LAMBDAS',
        createdAt: '2024-01-14T16:30:00Z',
        buildingAt: '2024-01-14T16:30:30Z',
        readyAt: '2024-01-14T16:33:15Z',
        source: 'git',
        target: 'main',
        gitSource: {
          type: 'github',
          repo: 'sentra-project',
          ref: 'main',
          sha: 'def456ghi789'
        }
      },
      {
        id: '3',
        projectId,
        url: 'https://sentra-dashboard-git-develop.vercel.app',
        environment: 'preview',
        state: 'BUILDING',
        type: 'LAMBDAS',
        createdAt: '2024-01-15T11:15:00Z',
        buildingAt: '2024-01-15T11:15:30Z',
        source: 'git',
        target: 'develop',
        gitSource: {
          type: 'github',
          repo: 'sentra-project',
          ref: 'develop',
          sha: 'ghi789jkl012'
        }
      }
    ]);
  }, [integration, projectId]);

  const handleConfigChange = (field: keyof DeploymentConfig, value: any) => {
    const newConfig = { ...deploymentConfig, [field]: value };
    setDeploymentConfig(newConfig);
    onConfigurationChange({ deploymentConfig: newConfig });
  };

  const handleEnvironmentToggle = (envName: string, field: keyof VercelEnvironment) => {
    const updatedEnvs = environments.map(env =>
      env.name === envName ? { ...env, [field]: !(env as any)[field] } : env
    );
    setEnvironments(updatedEnvs);
    onConfigurationChange({ environments: updatedEnvs });
  };

  const addEnvironmentVariable = () => {
    if (newEnvVar.key && newEnvVar.value && newEnvVar.target) {
      const updatedVars = [...deploymentConfig.environmentVariables, newEnvVar as EnvironmentVariable];
      const newConfig = { ...deploymentConfig, environmentVariables: updatedVars };
      setDeploymentConfig(newConfig);
      onConfigurationChange({ deploymentConfig: newConfig });
      setNewEnvVar({ key: '', value: '', target: ['development'], type: 'plain' });
    }
  };

  const removeEnvironmentVariable = (index: number) => {
    const updatedVars = deploymentConfig.environmentVariables.filter((_, i) => i !== index);
    const newConfig = { ...deploymentConfig, environmentVariables: updatedVars };
    setDeploymentConfig(newConfig);
    onConfigurationChange({ deploymentConfig: newConfig });
  };

  const triggerDeployment = async (environment: string) => {
    // This would trigger an actual deployment via Vercel API
    console.log(`Triggering deployment to ${environment}`);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'READY': return 'text-green-600';
      case 'ERROR': return 'text-red-600';
      case 'BUILDING': return 'text-blue-600';
      case 'QUEUED': return 'text-yellow-600';
      case 'INITIALIZING': return 'text-purple-600';
      case 'CANCELED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'READY': return CheckCircle;
      case 'ERROR': return XCircle;
      case 'BUILDING': return Clock;
      case 'QUEUED': return Clock;
      case 'INITIALIZING': return Clock;
      case 'CANCELED': return XCircle;
      default: return Clock;
    }
  };

  const getStateBadgeColor = (state: string) => {
    switch (state) {
      case 'READY': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'BUILDING': return 'bg-blue-100 text-blue-800';
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800';
      case 'INITIALIZING': return 'bg-purple-100 text-purple-800';
      case 'CANCELED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'deployments', name: 'Deployments', icon: Zap },
    { id: 'environments', name: 'Environments', icon: Globe },
    { id: 'config', name: 'Configuration', icon: Settings }
  ];

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vercel Integration</h1>
          <p className="text-gray-600">Automated deployment pipeline for your applications</p>
        </div>
        <div className="flex items-center space-x-3">
          {integration?.isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Zap className="w-4 h-4 mr-1" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <XCircle className="w-4 h-4 mr-1" />
              Disconnected
            </span>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="w-4 h-4 mr-2 inline" />
            Configure
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Production Status */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Production</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                      <span className="font-medium text-green-700">Healthy</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Deployment</p>
                      <p className="font-medium">2 hours ago</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Build Time</p>
                      <p className="font-medium">2m 45s</p>
                    </div>
                    <a
                      href={environments.find(env => env.name === 'production')?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visit Site
                    </a>
                  </div>
                </div>

                {/* Preview Deployments */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Deployments</h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-blue-600">
                      {deployments.filter(d => d.environment === 'preview').length}
                    </div>
                    <p className="text-sm text-gray-600">Active previews</p>
                    <div className="space-y-2">
                      {deployments.filter(d => d.environment === 'preview' && d.state === 'READY').slice(0, 2).map(deployment => (
                        <div key={deployment.id} className="text-sm">
                          <p className="font-medium truncate">{deployment.target}</p>
                          <p className="text-gray-600">{deployment.state}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Build Stats */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Performance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
                      <span className="text-2xl font-bold text-purple-600">98%</span>
                    </div>
                    <p className="text-sm text-gray-600">Success rate (last 30 days)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg build time</span>
                        <span className="font-medium">3m 12s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total builds</span>
                        <span className="font-medium">47</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Deployments */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {deployments.slice(0, 5).map((deployment) => {
                      const StateIcon = getStateIcon(deployment.state);
                      return (
                        <div key={deployment.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <StateIcon className={`w-5 h-5 ${getStateColor(deployment.state)}`} />
                              <div>
                                <p className="font-medium text-gray-900">{deployment.target || 'main'}</p>
                                <p className="text-sm text-gray-600">{deployment.environment}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-gray-900">
                                  {formatDuration(deployment.buildingAt || deployment.createdAt, deployment.readyAt)}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(deployment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStateBadgeColor(deployment.state)}`}>
                                {deployment.state}
                              </span>
                              <a
                                href={deployment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'deployments' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Deployment History</h3>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Play className="w-4 h-4 mr-2 inline" />
                    New Deployment
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {deployments.map((deployment) => {
                  const StateIcon = getStateIcon(deployment.state);
                  return (
                    <div key={deployment.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <StateIcon className={`w-6 h-6 ${getStateColor(deployment.state)}`} />
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">{deployment.target || 'main'}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStateBadgeColor(deployment.state)}`}>
                                {deployment.state}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span className="flex items-center">
                                <Globe className="w-4 h-4 mr-1" />
                                {deployment.environment}
                              </span>
                              <span className="flex items-center">
                                <GitBranch className="w-4 h-4 mr-1" />
                                {deployment.gitSource?.ref}
                              </span>
                              <span>
                                {new Date(deployment.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Build Duration</p>
                          <p className="font-medium">
                            {formatDuration(deployment.buildingAt || deployment.createdAt, deployment.readyAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Commit SHA</p>
                          <p className="font-medium font-mono">{deployment.gitSource?.sha?.substring(0, 8)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Source</p>
                          <p className="font-medium capitalize">{deployment.source}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">URL</p>
                          <a
                            href={deployment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-700 truncate block"
                          >
                            {deployment.url.replace('https://', '')}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'environments' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Environment Configuration</h3>

              <div className="space-y-6">
                {environments.map((env) => (
                  <div key={env.name} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          env.name === 'production' ? 'bg-green-500' :
                          env.name === 'preview' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <h4 className="text-lg font-medium text-gray-900 capitalize">{env.name}</h4>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => triggerDeployment(env.name)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-4 h-4 mr-1 inline" />
                          Deploy
                        </button>
                        {env.url && (
                          <a
                            href={env.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={env.url || ''}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://your-domain.vercel.app"
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Git Branch</label>
                        <input
                          type="text"
                          value={env.branch || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Branch name"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Auto Deploy</p>
                          <p className="text-sm text-gray-600">Automatically deploy when code is pushed to the connected branch</p>
                        </div>
                        <button
                          onClick={() => handleEnvironmentToggle(env.name, 'autoDeployEnabled')}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            env.autoDeployEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              env.autoDeployEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {env.name === 'production' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Protection Bypass</p>
                            <p className="text-sm text-gray-600">Allow deployments to bypass branch protection rules</p>
                          </div>
                          <button
                            onClick={() => handleEnvironmentToggle(env.name, 'protectionBypass')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              env.protectionBypass ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                env.protectionBypass ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl space-y-8">
                {/* Build Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Build Configuration</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Build Command</label>
                        <input
                          type="text"
                          value={deploymentConfig.buildCommand || ''}
                          onChange={(e) => handleConfigChange('buildCommand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="npm run build"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Output Directory</label>
                        <input
                          type="text"
                          value={deploymentConfig.outputDirectory || ''}
                          onChange={(e) => handleConfigChange('outputDirectory', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder=".next"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Install Command</label>
                        <input
                          type="text"
                          value={deploymentConfig.installCommand || ''}
                          onChange={(e) => handleConfigChange('installCommand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="npm install"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Development Command</label>
                        <input
                          type="text"
                          value={deploymentConfig.devCommand || ''}
                          onChange={(e) => handleConfigChange('devCommand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="npm run dev"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
                        <select
                          value={deploymentConfig.framework || ''}
                          onChange={(e) => handleConfigChange('framework', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Auto-detect</option>
                          <option value="nextjs">Next.js</option>
                          <option value="react">Create React App</option>
                          <option value="vue">Vue.js</option>
                          <option value="nuxtjs">Nuxt.js</option>
                          <option value="angular">Angular</option>
                          <option value="svelte">Svelte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Node.js Version</label>
                        <select
                          value={deploymentConfig.nodeVersion || ''}
                          onChange={(e) => handleConfigChange('nodeVersion', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="18.x">18.x (Recommended)</option>
                          <option value="16.x">16.x</option>
                          <option value="14.x">14.x</option>
                          <option value="20.x">20.x</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environment Variables */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Environment Variables</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    {/* Add New Environment Variable */}
                    <div className="grid grid-cols-12 gap-3 mb-4">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Key"
                          value={newEnvVar.key || ''}
                          onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Value"
                          value={newEnvVar.value || ''}
                          onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={newEnvVar.type || 'plain'}
                          onChange={(e) => setNewEnvVar({ ...newEnvVar, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="plain">Plain</option>
                          <option value="secret">Secret</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <select
                          multiple
                          value={newEnvVar.target || []}
                          onChange={(e) => setNewEnvVar({ 
                            ...newEnvVar, 
                            target: Array.from(e.target.selectedOptions, option => option.value) as any
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-[38px]"
                        >
                          <option value="production">Prod</option>
                          <option value="preview">Preview</option>
                          <option value="development">Dev</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={addEnvironmentVariable}
                          className="w-full h-[38px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Existing Environment Variables */}
                    <div className="space-y-2">
                      {deploymentConfig.environmentVariables.map((envVar, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-3">
                            <p className="text-sm font-medium text-gray-900">{envVar.key}</p>
                          </div>
                          <div className="col-span-4">
                            <p className="text-sm text-gray-600 font-mono">
                              {envVar.type === 'secret' ? '••••••••' : envVar.value}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              envVar.type === 'secret' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {envVar.type}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <div className="flex flex-wrap gap-1">
                              {envVar.target.map(target => (
                                <span key={target} className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  {target.substring(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => removeEnvironmentVariable(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {deploymentConfig.environmentVariables.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No environment variables configured</p>
                        <p className="text-sm">Add environment variables to securely store sensitive data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VercelIntegrationView;