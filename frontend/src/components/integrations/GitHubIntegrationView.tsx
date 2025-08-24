'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  GitPullRequest, 
  GitMerge, 
  Shield, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Edit2,
  ExternalLink
} from 'lucide-react';
import {
  GitHubIntegration,
  BranchStrategy,
  QualityGate,
  PullRequest,
  GitHubIssue,
  ConflictResolution
} from '../../types';

interface GitHubIntegrationViewProps {
  projectId: string;
  integration?: GitHubIntegration;
  onConfigurationChange: (config: Partial<GitHubIntegration>) => void;
}

const GitHubIntegrationView: React.FC<GitHubIntegrationViewProps> = ({
  projectId,
  integration,
  onConfigurationChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'quality-gates' | 'pull-requests' | 'conflicts'>('overview');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [githubIssues, setGitHubIssues] = useState<GitHubIssue[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const [branchConfig, setBranchConfig] = useState<BranchStrategy>({
    mainBranch: 'main',
    developBranch: 'develop',
    featureBranchPrefix: 'feature/',
    epicBranchPrefix: 'epic/',
    storyBranchPrefix: 'story/',
    agentBranchPrefix: 'agent/',
    autoMergePolicy: 'quality_gates',
    protectionRules: [
      {
        branch: 'main',
        requirePullRequest: true,
        requiredReviews: 2,
        dismissStaleReviews: true,
        requireCodeOwnerReviews: true,
        restrictPushes: true,
        requireStatusChecks: true,
        requiredStatusChecks: ['ci/tests', 'ci/security-scan', 'ci/type-check']
      }
    ]
  });

  const [qualityGates, setQualityGates] = useState<QualityGate[]>([
    {
      id: '1',
      name: 'Test Coverage',
      type: 'test_coverage',
      threshold: 80,
      required: true,
      timeout: 300
    },
    {
      id: '2',
      name: 'Security Scan',
      type: 'security_scan',
      threshold: 0,
      required: true,
      timeout: 180
    },
    {
      id: '3',
      name: 'Type Check',
      type: 'type_check',
      threshold: 0,
      required: true,
      timeout: 120
    },
    {
      id: '4',
      name: 'Performance Test',
      type: 'performance_test',
      threshold: 95,
      required: false,
      timeout: 600
    }
  ]);

  useEffect(() => {
    // Load integration data
    if (integration) {
      setBranchConfig(integration.branchStrategy);
      setQualityGates(integration.qualityGates);
    }
    
    // Mock data for demonstration
    setPullRequests([
      {
        id: '1',
        number: 123,
        title: 'feat: Add user authentication module',
        body: 'Implements OAuth2 authentication with JWT tokens and refresh token rotation.',
        state: 'open',
        sourceBranch: 'feature/auth-module',
        targetBranch: 'develop',
        author: 'agent-sarah',
        reviewers: [
          { id: '1', username: 'agent-james', status: 'approved', reviewedAt: '2024-01-15T10:30:00Z' },
          { id: '2', username: 'human-reviewer', status: 'pending' }
        ],
        checks: [
          { id: '1', name: 'ci/tests', status: 'success', startedAt: '2024-01-15T10:00:00Z', completedAt: '2024-01-15T10:05:00Z' },
          { id: '2', name: 'ci/security-scan', status: 'success', startedAt: '2024-01-15T10:05:00Z', completedAt: '2024-01-15T10:08:00Z' },
          { id: '3', name: 'ci/type-check', status: 'running', startedAt: '2024-01-15T10:08:00Z' }
        ],
        conflictsDetected: false,
        autoMergeEnabled: true,
        createdAt: '2024-01-15T09:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ]);

    setGitHubIssues([
      {
        id: '1',
        number: 456,
        title: 'Epic: User Management System',
        body: 'Complete user management system with authentication, profiles, and permissions.',
        state: 'open',
        labels: [
          { id: '1', name: 'epic', color: '8B5CF6', description: 'Large feature spanning multiple stories' },
          { id: '2', name: 'high-priority', color: 'DC2626', description: 'High priority item' }
        ],
        assignees: ['agent-sarah', 'agent-james'],
        milestone: 'v2.0.0',
        createdAt: '2024-01-14T08:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        linkedDecision: 'decision-123'
      }
    ]);

    setConflicts([]);
  }, [integration]);

  const handleBranchConfigChange = (field: keyof BranchStrategy, value: any) => {
    const newConfig = { ...branchConfig, [field]: value };
    setBranchConfig(newConfig);
    onConfigurationChange({ branchStrategy: newConfig });
  };

  const handleQualityGateToggle = (gateId: string) => {
    const updatedGates = qualityGates.map(gate => 
      gate.id === gateId ? { ...gate, required: !gate.required } : gate
    );
    setQualityGates(updatedGates);
    onConfigurationChange({ qualityGates: updatedGates });
  };

  const handleQualityGateThresholdChange = (gateId: string, threshold: number) => {
    const updatedGates = qualityGates.map(gate => 
      gate.id === gateId ? { ...gate, threshold } : gate
    );
    setQualityGates(updatedGates);
    onConfigurationChange({ qualityGates: updatedGates });
  };

  const createBranchFromDecision = async (decisionId: string, type: 'epic' | 'story') => {
    // This would integrate with the actual GitHub API
    console.log(`Creating ${type} branch from decision ${decisionId}`);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: GitBranch },
    { id: 'branches', name: 'Branch Strategy', icon: GitMerge },
    { id: 'quality-gates', name: 'Quality Gates', icon: Shield },
    { id: 'pull-requests', name: 'Pull Requests', icon: GitPullRequest },
    { id: 'conflicts', name: 'Conflicts', icon: AlertTriangle }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'failure': return XCircle;
      case 'running': return Clock;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GitHub Integration</h1>
          <p className="text-gray-600">Automated branch management and deployment pipeline</p>
        </div>
        <div className="flex items-center space-x-3">
          {integration?.isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <XCircle className="w-4 h-4 mr-1" />
              Disconnected
            </span>
          )}
          <button
            onClick={() => setIsConfiguring(!isConfiguring)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
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
                {/* Repository Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Owner/Repo</p>
                      <p className="font-medium">{integration?.owner}/{integration?.repo || 'sentra-project'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Main Branch</p>
                      <p className="font-medium">{branchConfig.mainBranch}</p>
                    </div>
                    <a
                      href={integration?.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View on GitHub
                    </a>
                  </div>
                </div>

                {/* Active Pull Requests */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active PRs</h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-green-600">
                      {pullRequests.filter(pr => pr.state === 'open').length}
                    </div>
                    <p className="text-sm text-gray-600">Open pull requests</p>
                    <div className="space-y-2">
                      {pullRequests.filter(pr => pr.state === 'open').slice(0, 2).map(pr => (
                        <div key={pr.id} className="text-sm">
                          <p className="font-medium truncate">#{pr.number} {pr.title}</p>
                          <p className="text-gray-600">{pr.sourceBranch} → {pr.targetBranch}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality Gates */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Gates</h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-purple-600">
                      {qualityGates.filter(gate => gate.required).length}
                    </div>
                    <p className="text-sm text-gray-600">Required checks</p>
                    <div className="space-y-2">
                      {qualityGates.filter(gate => gate.required).slice(0, 3).map(gate => (
                        <div key={gate.id} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span>{gate.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <GitPullRequest className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Pull request #123 opened</p>
                        <p className="text-sm text-gray-600">feat: Add user authentication module</p>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">All quality gates passed</p>
                        <p className="text-sm text-gray-600">feature/auth-module ready for review</p>
                      </div>
                      <span className="text-sm text-gray-500">3 hours ago</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <GitBranch className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Epic branch created</p>
                        <p className="text-sm text-gray-600">epic/user-management from decision #456</p>
                      </div>
                      <span className="text-sm text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'branches' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Automated Branch Strategy</h3>
                
                {/* Branch Configuration */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Branch Naming Convention</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Main Branch</label>
                      <input
                        type="text"
                        value={branchConfig.mainBranch}
                        onChange={(e) => handleBranchConfigChange('mainBranch', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Develop Branch</label>
                      <input
                        type="text"
                        value={branchConfig.developBranch}
                        onChange={(e) => handleBranchConfigChange('developBranch', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Epic Prefix</label>
                      <input
                        type="text"
                        value={branchConfig.epicBranchPrefix}
                        onChange={(e) => handleBranchConfigChange('epicBranchPrefix', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Story Prefix</label>
                      <input
                        type="text"
                        value={branchConfig.storyBranchPrefix}
                        onChange={(e) => handleBranchConfigChange('storyBranchPrefix', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Agent Prefix</label>
                      <input
                        type="text"
                        value={branchConfig.agentBranchPrefix}
                        onChange={(e) => handleBranchConfigChange('agentBranchPrefix', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Merge Policy</label>
                      <select
                        value={branchConfig.autoMergePolicy}
                        onChange={(e) => handleBranchConfigChange('autoMergePolicy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="never">Never</option>
                        <option value="quality_gates">After Quality Gates</option>
                        <option value="always">Always</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Branch Flow Visualization */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Branch Flow</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium text-gray-700">Decision Made</div>
                      <div className="flex-1 h-px bg-gray-300 relative">
                        <div className="absolute -top-2 left-1/4 w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="w-32 text-sm text-gray-600">Epic Branch Created</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium text-gray-700">Epic Branch</div>
                      <div className="flex-1 h-px bg-gray-300 relative">
                        <div className="absolute -top-2 left-1/4 w-4 h-4 bg-green-500 rounded-full"></div>
                        <div className="absolute -top-2 left-2/4 w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="w-32 text-sm text-gray-600">Story Branches</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium text-gray-700">Story Branch</div>
                      <div className="flex-1 h-px bg-gray-300 relative">
                        <div className="absolute -top-2 left-1/6 w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="absolute -top-2 left-2/6 w-4 h-4 bg-purple-500 rounded-full"></div>
                        <div className="absolute -top-2 left-3/6 w-4 h-4 bg-purple-500 rounded-full"></div>
                      </div>
                      <div className="w-32 text-sm text-gray-600">Agent Branches</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium text-gray-700">Agent Work</div>
                      <div className="flex-1 h-px bg-gray-300 relative">
                        <div className="absolute -top-2 left-3/4 w-4 h-4 bg-orange-500 rounded-full"></div>
                      </div>
                      <div className="w-32 text-sm text-gray-600">Pull Request</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'quality-gates' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quality Gate Configuration</h3>
                
                <div className="space-y-4">
                  {qualityGates.map((gate) => (
                    <div key={gate.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full mr-3 ${gate.required ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <h4 className="font-medium text-gray-900">{gate.name}</h4>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${gate.required ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {gate.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQualityGateToggle(gate.id)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                              gate.required 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {gate.required ? 'Required' : 'Optional'}
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <p className="text-sm text-gray-600 capitalize">{gate.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Threshold {gate.type === 'test_coverage' || gate.type === 'performance_test' ? '%' : ''}
                          </label>
                          <input
                            type="number"
                            value={gate.threshold}
                            onChange={(e) => handleQualityGateThresholdChange(gate.id, parseInt(e.target.value))}
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
                          <p className="text-sm text-gray-600">{gate.timeout}s</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quality Gate
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pull-requests' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-6xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Pull Request Management</h3>
                
                <div className="space-y-6">
                  {pullRequests.map((pr) => (
                    <div key={pr.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-medium text-gray-900">#{pr.number} {pr.title}</h4>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              pr.state === 'open' ? 'bg-green-100 text-green-800' :
                              pr.state === 'merged' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {pr.state}
                            </span>
                            {pr.autoMergeEnabled && (
                              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Auto-merge enabled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pr.body}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <GitBranch className="w-4 h-4 mr-1" />
                            <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                            <span className="mx-2">•</span>
                            <span>by {pr.author}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://github.com/owner/repo/pull/${pr.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* Status Checks */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Status Checks</h5>
                        <div className="space-y-2">
                          {pr.checks.map((check) => {
                            const StatusIcon = getStatusIcon(check.status);
                            return (
                              <div key={check.id} className="flex items-center">
                                <StatusIcon className={`w-4 h-4 mr-3 ${getStatusColor(check.status)}`} />
                                <span className="flex-1 text-sm">{check.name}</span>
                                <span className={`text-sm ${getStatusColor(check.status)}`}>
                                  {check.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reviewers */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Reviewers</h5>
                        <div className="flex items-center space-x-4">
                          {pr.reviewers.map((reviewer) => (
                            <div key={reviewer.id} className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                reviewer.status === 'approved' ? 'bg-green-500' :
                                reviewer.status === 'changes_requested' ? 'bg-red-500' :
                                reviewer.status === 'commented' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`} />
                              <span className="text-sm">{reviewer.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'conflicts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Conflict Resolution</h3>
                
                {conflicts.length === 0 ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No conflicts detected</h4>
                    <p className="text-gray-600">All pull requests are merge-ready with no conflicts.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {conflicts.map((conflict) => (
                      <div key={conflict.id} className="bg-white border border-red-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Pull Request #{conflict.pullRequestId}</h4>
                            <p className="text-sm text-gray-600">{conflict.conflictFiles.length} file(s) with conflicts</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            conflict.status === 'detected' ? 'bg-red-100 text-red-800' :
                            conflict.status === 'resolving' ? 'bg-yellow-100 text-yellow-800' :
                            conflict.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {conflict.status}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {conflict.conflictFiles.map((file, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2">{file.path}</h5>
                              <div className="bg-gray-50 rounded p-3 text-sm">
                                <p className="text-gray-600 mb-2">{file.conflictMarkers.length} conflict marker(s)</p>
                                {file.suggestedResolution && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                    <p className="text-blue-800 font-medium text-xs">AI Suggestion:</p>
                                    <p className="text-blue-700 text-xs mt-1">{file.suggestedResolution}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center space-x-3 mt-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Resolve with AI
                          </button>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Manual Resolution
                          </button>
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            View in Editor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GitHubIntegrationView;