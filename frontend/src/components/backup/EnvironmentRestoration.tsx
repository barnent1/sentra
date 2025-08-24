'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Terminal,
  FileText,
  Database,
  Package,
  Code,
  Folder,
  Monitor,
  Smartphone,
  Server,
  Play,
  Pause,
  Square,
  RefreshCw,
  Eye,
  Copy,
  ExternalLink,
  Zap,
  Shield,
  History,
  Target
} from 'lucide-react';
import {
  BackupSnapshot,
  RestoreOperation,
  BackupDevice,
  BackupMetadata
} from '../../types';

interface EnvironmentRestorationProps {
  projectId: string;
  snapshots: BackupSnapshot[];
  devices: BackupDevice[];
  onRestoreComplete: (operation: RestoreOperation) => void;
}

interface RestorationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  estimatedTime: number;
  dependencies: string[];
  logs: string[];
  critical: boolean;
}

interface RestorationPlan {
  id: string;
  snapshotId: string;
  targetDevice: string;
  estimatedDuration: number;
  steps: RestorationStep[];
  requirements: string[];
  warnings: string[];
}

const EnvironmentRestoration: React.FC<EnvironmentRestorationProps> = ({
  projectId,
  snapshots,
  devices,
  onRestoreComplete
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupSnapshot | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<BackupDevice | null>(null);
  const [restorationPlan, setRestorationPlan] = useState<RestorationPlan | null>(null);
  const [activeRestore, setActiveRestore] = useState<RestoreOperation | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<Record<string, boolean>>({});
  const [quickSetup, setQuickSetup] = useState(true);
  const [customOptions, setCustomOptions] = useState({
    includeNodeModules: false,
    installDependencies: true,
    restoreEnvironmentFiles: true,
    configureIDE: true,
    runPostInstallScripts: true,
    validateConfiguration: true,
    startDevelopmentServer: false
  });

  useEffect(() => {
    if (selectedSnapshot && selectedDevice) {
      generateRestorationPlan();
    }
  }, [selectedSnapshot, selectedDevice]);

  const generateRestorationPlan = async () => {
    if (!selectedSnapshot || !selectedDevice) return;

    const steps: RestorationStep[] = [
      {
        id: 'validate',
        name: 'Validate Environment',
        description: 'Check system requirements and available disk space',
        status: 'pending',
        progress: 0,
        estimatedTime: 30,
        dependencies: [],
        logs: [],
        critical: true
      },
      {
        id: 'download',
        name: 'Download Snapshot',
        description: 'Download and decrypt backup files',
        status: 'pending',
        progress: 0,
        estimatedTime: 120,
        dependencies: ['validate'],
        logs: [],
        critical: true
      },
      {
        id: 'extract',
        name: 'Extract Files',
        description: 'Extract and verify file integrity',
        status: 'pending',
        progress: 0,
        estimatedTime: 60,
        dependencies: ['download'],
        logs: [],
        critical: true
      },
      {
        id: 'restore_git',
        name: 'Restore Git Repository',
        description: 'Initialize Git repository and restore commit history',
        status: 'pending',
        progress: 0,
        estimatedTime: 45,
        dependencies: ['extract'],
        logs: [],
        critical: false
      },
      {
        id: 'restore_env',
        name: 'Restore Environment Files',
        description: 'Restore .env files and environment configuration',
        status: 'pending',
        progress: 0,
        estimatedTime: 15,
        dependencies: ['extract'],
        logs: [],
        critical: true
      },
      {
        id: 'install_node',
        name: 'Install Node.js Version',
        description: `Install Node.js ${selectedSnapshot.metadata.nodeVersion}`,
        status: 'pending',
        progress: 0,
        estimatedTime: 90,
        dependencies: ['extract'],
        logs: [],
        critical: true
      },
      {
        id: 'install_deps',
        name: 'Install Dependencies',
        description: 'Run npm install and restore package dependencies',
        status: 'pending',
        progress: 0,
        estimatedTime: 180,
        dependencies: ['install_node', 'restore_env'],
        logs: [],
        critical: true
      },
      {
        id: 'restore_ide',
        name: 'Configure IDE Settings',
        description: 'Restore VS Code settings, extensions, and workspace configuration',
        status: 'pending',
        progress: 0,
        estimatedTime: 30,
        dependencies: ['extract'],
        logs: [],
        critical: false
      },
      {
        id: 'post_install',
        name: 'Run Post-Install Scripts',
        description: 'Execute post-installation setup scripts',
        status: 'pending',
        progress: 0,
        estimatedTime: 60,
        dependencies: ['install_deps'],
        logs: [],
        critical: false
      },
      {
        id: 'validate_config',
        name: 'Validate Configuration',
        description: 'Verify project configuration and run health checks',
        status: 'pending',
        progress: 0,
        estimatedTime: 45,
        dependencies: ['post_install', 'restore_ide'],
        logs: [],
        critical: true
      },
      {
        id: 'start_dev',
        name: 'Start Development Server',
        description: 'Launch development server and verify functionality',
        status: 'pending',
        progress: 0,
        estimatedTime: 30,
        dependencies: ['validate_config'],
        logs: [],
        critical: false
      }
    ];

    // Filter steps based on custom options
    const filteredSteps = steps.filter(step => {
      if (!customOptions.installDependencies && step.id === 'install_deps') return false;
      if (!customOptions.restoreEnvironmentFiles && step.id === 'restore_env') return false;
      if (!customOptions.configureIDE && step.id === 'restore_ide') return false;
      if (!customOptions.runPostInstallScripts && step.id === 'post_install') return false;
      if (!customOptions.validateConfiguration && step.id === 'validate_config') return false;
      if (!customOptions.startDevelopmentServer && step.id === 'start_dev') return false;
      return true;
    });

    const totalTime = filteredSteps.reduce((acc, step) => acc + step.estimatedTime, 0);

    const requirements = [
      `Node.js ${selectedSnapshot.metadata.nodeVersion} or compatible version`,
      'Git installed and configured',
      `At least ${Math.ceil(selectedSnapshot.size / (1024 * 1024 * 1024))}GB free disk space`,
      'Internet connection for dependency installation',
      'Administrative privileges (if required by dependencies)'
    ];

    const warnings = [];
    if (selectedSnapshot.metadata.environmentFiles.length > 0) {
      warnings.push('Environment files contain sensitive information - ensure secure handling');
    }
    if (selectedSnapshot.size > 5 * 1024 * 1024 * 1024) {
      warnings.push('Large backup size - restoration may take significant time');
    }
    if (selectedDevice.type === 'mobile') {
      warnings.push('Mobile device selected - limited development capabilities');
    }

    const plan: RestorationPlan = {
      id: `plan-${Date.now()}`,
      snapshotId: selectedSnapshot.id,
      targetDevice: selectedDevice.id,
      estimatedDuration: totalTime,
      steps: filteredSteps,
      requirements,
      warnings
    };

    setRestorationPlan(plan);
  };

  const startRestoration = async () => {
    if (!restorationPlan) return;

    const restoreOp: RestoreOperation = {
      id: `restore-${Date.now()}`,
      snapshotId: restorationPlan.snapshotId,
      targetDevice: restorationPlan.targetDevice,
      status: 'in_progress',
      progress: 0,
      estimatedTimeRemaining: restorationPlan.estimatedDuration,
      startedAt: new Date().toISOString(),
      errors: []
    };

    setActiveRestore(restoreOp);
    
    // Execute restoration steps
    await executeRestorationSteps(restorationPlan.steps);
  };

  const executeRestorationSteps = async (steps: RestorationStep[]) => {
    let totalProgress = 0;
    const totalSteps = steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(step.id);
      
      // Update step status
      setRestorationPlan(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === step.id ? { ...s, status: 'running' } : s)
      } : null);

      // Simulate step execution
      await executeStep(step);

      totalProgress = ((i + 1) / totalSteps) * 100;
      
      // Update restore operation progress
      setActiveRestore(prev => prev ? {
        ...prev,
        progress: totalProgress,
        estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - step.estimatedTime)
      } : null);

      // Update step status to completed
      setRestorationPlan(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === step.id ? { ...s, status: 'completed', progress: 100 } : s)
      } : null);
    }

    // Complete restoration
    const completedRestore: RestoreOperation = {
      ...activeRestore!,
      status: 'completed',
      progress: 100,
      estimatedTimeRemaining: 0,
      completedAt: new Date().toISOString()
    };

    setActiveRestore(completedRestore);
    onRestoreComplete(completedRestore);
  };

  const executeStep = async (step: RestorationStep) => {
    const logs: string[] = [];

    // Simulate step execution with realistic logs
    switch (step.id) {
      case 'validate':
        logs.push('Checking system requirements...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        logs.push('✓ Node.js compatibility verified');
        logs.push('✓ Git installation confirmed');
        logs.push('✓ Disk space sufficient');
        break;

      case 'download':
        logs.push('Initiating secure download from backup storage...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        logs.push('✓ Backup file downloaded');
        logs.push('✓ Decryption successful');
        logs.push('✓ File integrity verified');
        break;

      case 'extract':
        logs.push('Extracting backup archive...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        logs.push(`✓ Extracted ${selectedSnapshot?.fileCount} files`);
        logs.push('✓ Checksum verification passed');
        break;

      case 'restore_git':
        logs.push('Initializing Git repository...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        logs.push(`✓ Restored to commit ${selectedSnapshot?.metadata.gitCommit?.substring(0, 8)}`);
        logs.push(`✓ Checked out branch ${selectedSnapshot?.metadata.branchName}`);
        break;

      case 'restore_env':
        logs.push('Restoring environment files...');
        await new Promise(resolve => setTimeout(resolve, 500));
        selectedSnapshot?.metadata.environmentFiles.forEach(file => {
          logs.push(`✓ Restored ${file}`);
        });
        break;

      case 'install_node':
        logs.push(`Installing Node.js ${selectedSnapshot?.metadata.nodeVersion}...`);
        await new Promise(resolve => setTimeout(resolve, 2500));
        logs.push('✓ Node.js installation complete');
        logs.push('✓ npm version updated');
        break;

      case 'install_deps':
        logs.push('Installing project dependencies...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        logs.push('✓ Dependencies installed successfully');
        logs.push('✓ Lock file updated');
        break;

      case 'restore_ide':
        logs.push('Configuring IDE settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        selectedSnapshot?.metadata.ideConfigs.forEach(config => {
          logs.push(`✓ Restored ${config}`);
        });
        break;

      case 'post_install':
        logs.push('Running post-installation scripts...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        logs.push('✓ Build scripts executed');
        logs.push('✓ Development tools configured');
        break;

      case 'validate_config':
        logs.push('Validating project configuration...');
        await new Promise(resolve => setTimeout(resolve, 1200));
        logs.push('✓ TypeScript configuration valid');
        logs.push('✓ Build process verified');
        logs.push('✓ All health checks passed');
        break;

      case 'start_dev':
        logs.push('Starting development server...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        logs.push('✓ Development server running on http://localhost:3000');
        logs.push('✓ Hot reload enabled');
        break;

      default:
        logs.push(`Executing ${step.name}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        logs.push('✓ Step completed');
    }

    // Update step logs
    setRestorationPlan(prev => prev ? {
      ...prev,
      steps: prev.steps.map(s => s.id === step.id ? { ...s, logs } : s)
    } : null);
  };

  const pauseRestoration = () => {
    if (activeRestore) {
      setActiveRestore({
        ...activeRestore,
        status: 'queued'
      });
    }
  };

  const cancelRestoration = () => {
    if (activeRestore) {
      setActiveRestore({
        ...activeRestore,
        status: 'cancelled',
        completedAt: new Date().toISOString()
      });
    }
    setCurrentStep(null);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Smartphone;
      case 'laptop': return Monitor;
      case 'desktop': return Monitor;
      case 'server': return Server;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'skipped': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return RefreshCw;
      case 'failed': return XCircle;
      case 'skipped': return XCircle;
      default: return Clock;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Environment Restoration</h2>
          <p className="text-gray-600">Restore complete development environment from backup snapshot</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Target className="w-4 h-4 mr-1" />
            5-10 minute setup
          </span>
        </div>
      </div>

      {!activeRestore ? (
        <div className="space-y-6">
          {/* Snapshot Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Backup Snapshot</h3>
            <div className="grid grid-cols-1 gap-4">
              {snapshots.map(snapshot => (
                <div
                  key={snapshot.id}
                  onClick={() => setSelectedSnapshot(snapshot)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedSnapshot?.id === snapshot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <History className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {new Date(snapshot.timestamp).toLocaleDateString()}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatBytes(snapshot.size)}</span>
                          <span>{snapshot.fileCount.toLocaleString()} files</span>
                          <span>v{snapshot.metadata.projectVersion}</span>
                          <span>Node {snapshot.metadata.nodeVersion}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {snapshot.encrypted && <Shield className="w-4 h-4 text-purple-500" />}
                      {snapshot.restorable && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Target Device</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => {
                const DeviceIcon = getDeviceIcon(device.type);
                return (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDevice?.id === device.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <DeviceIcon className="w-8 h-8 text-gray-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{device.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{device.type}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Restoration Options */}
          {selectedSnapshot && selectedDevice && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Restoration Options</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuickSetup(!quickSetup)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      quickSetup 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Quick Setup
                  </button>
                  <button
                    onClick={() => setQuickSetup(!quickSetup)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      !quickSetup 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {!quickSetup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(customOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setCustomOptions({
                          ...customOptions,
                          [key]: e.target.checked
                        })}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="text-sm text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {restorationPlan && (
                <div className="space-y-4">
                  {/* Plan Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {restorationPlan.steps.length}
                        </div>
                        <p className="text-sm text-gray-600">Steps</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatTime(restorationPlan.estimatedDuration)}
                        </div>
                        <p className="text-sm text-gray-600">Estimated Time</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatBytes(selectedSnapshot.size)}
                        </div>
                        <p className="text-sm text-gray-600">Data Size</p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {restorationPlan.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Warnings */}
                  {restorationPlan.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Warnings</h4>
                      <ul className="space-y-1">
                        {restorationPlan.warnings.map((warning, index) => (
                          <li key={index} className="flex items-center text-sm text-orange-600">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Start Restoration Button */}
                  <div className="flex items-center justify-center pt-4">
                    <button
                      onClick={startRestoration}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Start Environment Restoration</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Active Restoration */
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Restoration in Progress</h3>
                <p className="text-sm text-gray-600">
                  Restoring to {devices.find(d => d.id === activeRestore.targetDevice)?.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {activeRestore.status === 'in_progress' && (
                  <>
                    <button
                      onClick={pauseRestoration}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="w-4 h-4 mr-1 inline" />
                      Pause
                    </button>
                    <button
                      onClick={cancelRestoration}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Square className="w-4 h-4 mr-1 inline" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Overall Progress: {activeRestore.progress}%
                </span>
                <span className="text-sm text-gray-600">
                  {formatTime(activeRestore.estimatedTimeRemaining)} remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${activeRestore.progress}%` }}
                />
              </div>
            </div>

            {/* Current Step Highlight */}
            {currentStep && restorationPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {restorationPlan.steps.find(s => s.id === currentStep)?.name}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {restorationPlan.steps.find(s => s.id === currentStep)?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Steps */}
          {restorationPlan && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Restoration Steps</h3>
              <div className="space-y-4">
                {restorationPlan.steps.map((step, index) => {
                  const StatusIcon = getStatusIcon(step.status);
                  const isActive = currentStep === step.id;
                  
                  return (
                    <div key={step.id} className={`border rounded-lg p-4 ${
                      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                            <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{step.name}</span>
                              {step.critical && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                            </h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(step.status)} ${
                            step.status === 'running' ? 'animate-spin' : ''
                          }`} />
                          <span className="text-sm text-gray-500">
                            {formatTime(step.estimatedTime)}
                          </span>
                          {step.logs.length > 0 && (
                            <button
                              onClick={() => setShowLogs({
                                ...showLogs,
                                [step.id]: !showLogs[step.id]
                              })}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Terminal className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step Logs */}
                      {showLogs[step.id] && step.logs.length > 0 && (
                        <div className="mt-3 bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-sm max-h-40 overflow-y-auto">
                          {step.logs.map((log, logIndex) => (
                            <div key={logIndex} className="mb-1">
                              <span className="text-gray-500">$ </span>
                              {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion Status */}
          {activeRestore.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Environment Restoration Complete!
                  </h3>
                  <p className="text-green-700">
                    Your development environment has been successfully restored and is ready to use.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Project Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>All files restored</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Dependencies installed</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Configuration validated</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      <ExternalLink className="w-4 h-4 mr-1 inline" />
                      Open in IDE
                    </button>
                    <button className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                      <Zap className="w-4 h-4 mr-1 inline" />
                      Start Dev Server
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Restoration Stats</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Duration: {formatTime(restorationPlan?.estimatedDuration || 0)}</div>
                    <div>Files: {selectedSnapshot?.fileCount.toLocaleString()}</div>
                    <div>Size: {formatBytes(selectedSnapshot?.size || 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentRestoration;