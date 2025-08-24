'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  Cloud,
  Smartphone,
  Monitor,
  Server,
  Lock,
  Key,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Copy,
  FileText,
  Database,
  Code,
  Folder,
  HardDrive,
  Wifi,
  WifiOff,
  Zap,
  RotateCcw,
  History
} from 'lucide-react';
import {
  BackupConfig,
  BackupDevice,
  BackupTarget,
  BackupSnapshot,
  RestoreOperation,
  TwoFactorAuth,
  BackupMetadata
} from '../../types';

interface BackupSyncManagerProps {
  projectId: string;
  backupConfig?: BackupConfig;
  onConfigurationChange: (config: Partial<BackupConfig>) => void;
}

const BackupSyncManager: React.FC<BackupSyncManagerProps> = ({
  projectId,
  backupConfig,
  onConfigurationChange
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'targets' | 'snapshots' | 'restore' | 'security'>('overview');
  const [devices, setDevices] = useState<BackupDevice[]>([]);
  const [targets, setTargets] = useState<BackupTarget[]>([]);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [restoreOperations, setRestoreOperations] = useState<RestoreOperation[]>([]);
  const [twoFactorAuth, setTwoFactorAuth] = useState<TwoFactorAuth | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<Record<string, boolean>>({});
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const [newDevice, setNewDevice] = useState<Partial<BackupDevice>>({
    name: '',
    type: 'desktop',
    isActive: true
  });

  const [newTarget, setNewTarget] = useState<Partial<BackupTarget>>({
    type: 'cloud',
    provider: 'aws_s3',
    isActive: true,
    config: {}
  });

  useEffect(() => {
    // Load backup data
    setDevices([
      {
        id: '1',
        name: 'MacBook Pro (Primary)',
        type: 'laptop',
        lastSyncAt: '2024-01-15T10:30:00Z',
        syncStatus: 'connected',
        encryptionKey: 'encrypted_key_1',
        isActive: true
      },
      {
        id: '2',
        name: 'iPhone 14 Pro',
        type: 'mobile',
        lastSyncAt: '2024-01-15T09:45:00Z',
        syncStatus: 'syncing',
        encryptionKey: 'encrypted_key_2',
        isActive: true
      },
      {
        id: '3',
        name: 'Home Desktop',
        type: 'desktop',
        lastSyncAt: '2024-01-14T18:20:00Z',
        syncStatus: 'disconnected',
        encryptionKey: 'encrypted_key_3',
        isActive: false
      }
    ]);

    setTargets([
      {
        id: '1',
        type: 'cloud',
        provider: 'aws_s3',
        config: {
          bucket: 'sentra-backups',
          region: 'us-east-1',
          accessKeyId: 'encrypted_access_key',
          secretAccessKey: 'encrypted_secret_key'
        },
        isActive: true
      },
      {
        id: '2',
        type: 'cloud',
        provider: 'google_drive',
        config: {
          folderId: 'encrypted_folder_id',
          accessToken: 'encrypted_token'
        },
        isActive: true
      },
      {
        id: '3',
        type: 'local',
        provider: 'local_disk',
        config: {
          path: '/Users/backup/sentra-snapshots',
          maxSize: '100GB'
        },
        isActive: false
      }
    ]);

    setSnapshots([
      {
        id: '1',
        projectId,
        timestamp: '2024-01-15T10:00:00Z',
        size: 2147483648, // 2GB
        fileCount: 15432,
        checksum: 'sha256:abc123def456',
        encrypted: true,
        restorable: true,
        metadata: {
          gitCommit: 'abc123def456789',
          branchName: 'main',
          environmentFiles: ['.env', '.env.local', '.env.production'],
          ideConfigs: ['.vscode/', '.idea/', 'sentra.code-workspace'],
          dependencies: {
            'react': '^18.2.0',
            'next': '^14.0.0',
            'typescript': '^5.2.2'
          },
          projectVersion: '1.2.3',
          nodeVersion: '18.17.0'
        }
      },
      {
        id: '2',
        projectId,
        timestamp: '2024-01-15T06:00:00Z',
        size: 2098765432, // ~2GB
        fileCount: 15389,
        checksum: 'sha256:def456ghi789',
        encrypted: true,
        restorable: true,
        metadata: {
          gitCommit: 'def456ghi789abc',
          branchName: 'develop',
          environmentFiles: ['.env', '.env.local'],
          ideConfigs: ['.vscode/', 'sentra.code-workspace'],
          dependencies: {
            'react': '^18.2.0',
            'next': '^14.0.0',
            'typescript': '^5.2.2'
          },
          projectVersion: '1.2.2',
          nodeVersion: '18.17.0'
        }
      }
    ]);

    setTwoFactorAuth({
      id: '1',
      userId: 'current-user',
      enabled: true,
      method: 'google_authenticator',
      secretKey: 'encrypted_secret_key',
      backupCodes: [
        'backup-code-1',
        'backup-code-2',
        'backup-code-3',
        'backup-code-4',
        'backup-code-5',
        'backup-code-6'
      ],
      lastUsedAt: '2024-01-14T12:00:00Z'
    });
  }, [projectId]);

  const syncDevice = async (deviceId: string) => {
    setSyncInProgress(prev => ({ ...prev, [deviceId]: true }));
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setDevices(devices => devices.map(device => 
      device.id === deviceId 
        ? { ...device, lastSyncAt: new Date().toISOString(), syncStatus: 'connected' as const }
        : device
    ));
    
    setSyncInProgress(prev => ({ ...prev, [deviceId]: false }));
  };

  const createBackup = async () => {
    const newSnapshot: BackupSnapshot = {
      id: `snapshot-${Date.now()}`,
      projectId,
      timestamp: new Date().toISOString(),
      size: Math.floor(Math.random() * 1000000000) + 2000000000,
      fileCount: Math.floor(Math.random() * 5000) + 15000,
      checksum: `sha256:${Math.random().toString(36).substring(2, 15)}`,
      encrypted: true,
      restorable: true,
      metadata: {
        gitCommit: Math.random().toString(36).substring(2, 15),
        branchName: 'main',
        environmentFiles: ['.env', '.env.local', '.env.production'],
        ideConfigs: ['.vscode/', '.idea/', 'sentra.code-workspace'],
        dependencies: {
          'react': '^18.2.0',
          'next': '^14.0.0',
          'typescript': '^5.2.2'
        },
        projectVersion: '1.2.4',
        nodeVersion: '18.17.0'
      }
    };

    setSnapshots(prev => [newSnapshot, ...prev]);
  };

  const restoreFromSnapshot = async (snapshotId: string, targetDeviceId: string) => {
    const newRestore: RestoreOperation = {
      id: `restore-${Date.now()}`,
      snapshotId,
      targetDevice: targetDeviceId,
      status: 'in_progress',
      progress: 0,
      estimatedTimeRemaining: 600, // 10 minutes
      startedAt: new Date().toISOString(),
      errors: []
    };

    setRestoreOperations(prev => [newRestore, ...prev]);

    // Simulate restore progress
    const updateProgress = async () => {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setRestoreOperations(operations => operations.map(op => 
          op.id === newRestore.id 
            ? { 
                ...op, 
                progress, 
                estimatedTimeRemaining: Math.max(0, op.estimatedTimeRemaining - 60),
                status: progress === 100 ? 'completed' : 'in_progress',
                completedAt: progress === 100 ? new Date().toISOString() : undefined
              }
            : op
        ));
      }
    };

    updateProgress();
  };

  const addDevice = () => {
    if (newDevice.name) {
      const device: BackupDevice = {
        id: `device-${Date.now()}`,
        name: newDevice.name,
        type: newDevice.type!,
        lastSyncAt: new Date().toISOString(),
        syncStatus: 'disconnected',
        encryptionKey: `encrypted_key_${Date.now()}`,
        isActive: newDevice.isActive!
      };
      
      setDevices(prev => [...prev, device]);
      setNewDevice({ name: '', type: 'desktop', isActive: true });
    }
  };

  const addTarget = () => {
    if (newTarget.provider) {
      const target: BackupTarget = {
        id: `target-${Date.now()}`,
        type: newTarget.type!,
        provider: newTarget.provider!,
        config: newTarget.config!,
        isActive: newTarget.isActive!
      };
      
      setTargets(prev => [...prev, target]);
      setNewTarget({ type: 'cloud', provider: 'aws_s3', isActive: true, config: {} });
    }
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 6 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    
    if (twoFactorAuth) {
      setTwoFactorAuth({
        ...twoFactorAuth,
        backupCodes: codes
      });
    }
  };

  const setup2FA = async () => {
    // Simulate QR code generation
    setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws_s3': return Cloud;
      case 'google_drive': return Cloud;
      case 'dropbox': return Cloud;
      case 'local_disk': return HardDrive;
      case 'network_drive': return Server;
      default: return Cloud;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'syncing': return 'text-blue-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return Wifi;
      case 'syncing': return RefreshCw;
      case 'disconnected': return WifiOff;
      case 'error': return XCircle;
      default: return WifiOff;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Shield },
    { id: 'devices', name: 'Devices', icon: Monitor },
    { id: 'targets', name: 'Backup Targets', icon: Cloud },
    { id: 'snapshots', name: 'Snapshots', icon: History },
    { id: 'restore', name: 'Restore', icon: RotateCcw },
    { id: 'security', name: '2FA Security', icon: Lock }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup & Sync Manager</h1>
          <p className="text-gray-600">Complete project backup with multi-device synchronization and security</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            AES-256 Encrypted
          </span>
          <button
            onClick={createBackup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2 inline" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                {/* Backup Status */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                      <span className="font-medium text-green-700">Up to Date</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Backup</p>
                      <p className="font-medium">{formatTimeAgo(snapshots[0]?.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Backup Size</p>
                      <p className="font-medium">{formatBytes(snapshots[0]?.size || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Files Backed Up</p>
                      <p className="font-medium">{snapshots[0]?.fileCount.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Device Sync */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Sync</h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-green-600">
                      {devices.filter(d => d.syncStatus === 'connected').length}/{devices.length}
                    </div>
                    <p className="text-sm text-gray-600">Devices synchronized</p>
                    <div className="space-y-2">
                      {devices.slice(0, 3).map(device => {
                        const DeviceIcon = getDeviceIcon(device.type);
                        const StatusIcon = getSyncStatusIcon(device.syncStatus);
                        return (
                          <div key={device.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DeviceIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium">{device.name}</span>
                            </div>
                            <StatusIcon className={`w-4 h-4 ${getSyncStatusColor(device.syncStatus)}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Security Status */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Lock className="w-6 h-6 text-purple-500 mr-2" />
                      <span className="font-medium text-purple-700">AES-256 Encrypted</span>
                    </div>
                    <div className="flex items-center">
                      <Key className="w-6 h-6 text-purple-500 mr-2" />
                      <span className="font-medium text-purple-700">
                        2FA {twoFactorAuth?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Backup Targets</p>
                      <p className="font-medium">{targets.filter(t => t.isActive).length} Active</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Snapshots</p>
                      <p className="font-medium">{snapshots.length} Available</p>
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
                        <Download className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Backup created successfully</p>
                        <p className="text-sm text-gray-600">
                          {formatBytes(snapshots[0]?.size || 0)} • {snapshots[0]?.fileCount.toLocaleString()} files
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">{formatTimeAgo(snapshots[0]?.timestamp)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <RefreshCw className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Device synchronized</p>
                        <p className="text-sm text-gray-600">MacBook Pro • All files up to date</p>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">2FA authentication verified</p>
                        <p className="text-sm text-gray-600">Google Authenticator • Backup access granted</p>
                      </div>
                      <span className="text-sm text-gray-500">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'devices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Add New Device */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Device</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                      placeholder="Device name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={newDevice.type}
                      onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="desktop">Desktop</option>
                      <option value="laptop">Laptop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="server">Server</option>
                    </select>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newDevice.isActive}
                        onChange={(e) => setNewDevice({ ...newDevice, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button
                      onClick={addDevice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Add Device
                    </button>
                  </div>
                </div>

                {/* Device List */}
                <div className="space-y-4">
                  {devices.map(device => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    const StatusIcon = getSyncStatusIcon(device.syncStatus);
                    const isSyncing = syncInProgress[device.id];

                    return (
                      <div key={device.id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                              <DeviceIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{device.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="capitalize">{device.type}</span>
                                <span className="flex items-center">
                                  <StatusIcon className={`w-4 h-4 mr-1 ${getSyncStatusColor(device.syncStatus)} ${device.syncStatus === 'syncing' || isSyncing ? 'animate-spin' : ''}`} />
                                  {isSyncing ? 'Syncing...' : device.syncStatus}
                                </span>
                                <span>Last sync: {formatTimeAgo(device.lastSyncAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                              <p className="font-medium text-gray-900">
                                {device.isActive ? 'Active' : 'Inactive'}
                              </p>
                              <p className="text-gray-600">
                                Key: •••{device.encryptionKey.slice(-4)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => syncDevice(device.id)}
                                disabled={isSyncing || device.syncStatus === 'syncing'}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RefreshCw className={`w-4 h-4 mr-1 inline ${isSyncing ? 'animate-spin' : ''}`} />
                                Sync
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Settings className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sync Progress */}
                        {isSyncing && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">Synchronizing...</span>
                              <span className="text-sm text-gray-600">Encrypting and uploading</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                                style={{ width: '60%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'targets' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Add New Target */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Backup Target</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={newTarget.type}
                      onChange={(e) => setNewTarget({ ...newTarget, type: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cloud">Cloud Storage</option>
                      <option value="local">Local Storage</option>
                      <option value="network">Network Drive</option>
                    </select>
                    <select
                      value={newTarget.provider}
                      onChange={(e) => setNewTarget({ ...newTarget, provider: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="aws_s3">Amazon S3</option>
                      <option value="google_drive">Google Drive</option>
                      <option value="dropbox">Dropbox</option>
                      <option value="local_disk">Local Disk</option>
                      <option value="network_drive">Network Drive</option>
                    </select>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTarget.isActive}
                        onChange={(e) => setNewTarget({ ...newTarget, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <button
                      onClick={addTarget}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Add Target
                    </button>
                  </div>
                </div>

                {/* Target List */}
                <div className="space-y-4">
                  {targets.map(target => {
                    const ProviderIcon = getProviderIcon(target.provider);

                    return (
                      <div key={target.id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl">
                              <ProviderIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {target.provider.replace('_', ' ')}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="capitalize">{target.type}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  target.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {target.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                              <Settings className="w-4 h-4 mr-1 inline" />
                              Configure
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Target Configuration Preview */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Configuration</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {Object.entries(target.config).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="ml-2 font-mono">
                                  {key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')
                                    ? '••••••••'
                                    : String(value)
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'snapshots' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Backup Snapshots</h3>
                  <button
                    onClick={createBackup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 inline" />
                    Create New Backup
                  </button>
                </div>

                <div className="space-y-4">
                  {snapshots.map(snapshot => (
                    <div key={snapshot.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                            <History className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                Snapshot {new Date(snapshot.timestamp).toLocaleDateString()}
                              </h4>
                              {snapshot.encrypted && (
                                <Lock className="w-4 h-4 text-purple-500" />
                              )}
                              {snapshot.restorable && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{formatBytes(snapshot.size)}</span>
                              <span>{snapshot.fileCount.toLocaleString()} files</span>
                              <span>Branch: {snapshot.metadata.branchName}</span>
                              <span title={snapshot.checksum}>
                                Checksum: {snapshot.checksum.split(':')[1]?.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </span>
                          <button
                            onClick={() => {/* Download snapshot */}}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1 inline" />
                            Download
                          </button>
                          <button
                            onClick={() => restoreFromSnapshot(snapshot.id, devices[0]?.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4 mr-1 inline" />
                            Restore
                          </button>
                        </div>
                      </div>

                      {/* Snapshot Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Git Information</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Commit:</span>
                              <span className="font-mono">{snapshot.metadata.gitCommit?.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Branch:</span>
                              <span className="font-medium">{snapshot.metadata.branchName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Version:</span>
                              <span className="font-medium">{snapshot.metadata.projectVersion}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Environment</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Node.js:</span>
                              <span className="font-medium">{snapshot.metadata.nodeVersion}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Env Files:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {snapshot.metadata.environmentFiles.map(file => (
                                  <span key={file} className="px-1 py-0.5 text-xs bg-gray-100 rounded">
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">IDE Configs</h5>
                          <div className="flex flex-wrap gap-1">
                            {snapshot.metadata.ideConfigs.map(config => (
                              <span key={config} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {config}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Dependencies Preview */}
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-900 mb-2">Key Dependencies</h5>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(snapshot.metadata.dependencies).map(([name, version]) => (
                            <span key={name} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              {name}@{version}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'restore' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Restore Operations</h3>

                {restoreOperations.length > 0 ? (
                  <div className="space-y-4">
                    {restoreOperations.map(restore => (
                      <div key={restore.id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Restore to {devices.find(d => d.id === restore.targetDevice)?.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              From snapshot {restore.snapshotId} • Started {formatTimeAgo(restore.startedAt)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            restore.status === 'completed' ? 'bg-green-100 text-green-800' :
                            restore.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            restore.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {restore.status.replace('_', ' ')}
                          </span>
                        </div>

                        {restore.status === 'in_progress' && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Progress: {restore.progress}%
                              </span>
                              <span className="text-sm text-gray-600">
                                {Math.floor(restore.estimatedTimeRemaining / 60)}m {restore.estimatedTimeRemaining % 60}s remaining
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${restore.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {restore.status === 'completed' && restore.completedAt && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-green-700 font-medium">
                                Restore completed successfully at {new Date(restore.completedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {restore.errors.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-4">
                            <h5 className="font-medium text-red-900 mb-2">Errors:</h5>
                            <ul className="space-y-1">
                              {restore.errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-700 flex items-center">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Restore Operations</h4>
                    <p className="text-gray-600">
                      Go to the Snapshots tab to restore from a backup snapshot.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>

                {twoFactorAuth?.enabled ? (
                  <div className="space-y-6">
                    {/* 2FA Status */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                          <div>
                            <h4 className="font-semibold text-green-900">
                              Two-Factor Authentication Enabled
                            </h4>
                            <p className="text-sm text-green-700">
                              Method: Google Authenticator • Last used: {formatTimeAgo(twoFactorAuth.lastUsedAt!)}
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                          Disable 2FA
                        </button>
                      </div>
                    </div>

                    {/* Backup Codes */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Backup Codes</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowBackupCodes(!showBackupCodes)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={generateBackupCodes}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Generate New
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Use these backup codes to access your account if you lose access to your authenticator app.
                        Each code can only be used once.
                      </p>

                      {showBackupCodes && (
                        <div className="grid grid-cols-2 gap-2">
                          {twoFactorAuth.backupCodes.map((code, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-mono text-sm">{code}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(code)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Security Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Require 2FA for backup access</p>
                            <p className="text-sm text-gray-600">Always require 2FA when accessing backup data</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={backupConfig?.twoFactorRequired}
                            onChange={(e) => onConfigurationChange({ twoFactorRequired: e.target.checked })}
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Encryption enabled</p>
                            <p className="text-sm text-gray-600">All backups are encrypted with AES-256</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={backupConfig?.encryptionEnabled}
                            onChange={(e) => onConfigurationChange({ encryptionEnabled: e.target.checked })}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Setup 2FA */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                          <div>
                            <h4 className="font-semibold text-orange-900">
                              Two-Factor Authentication Disabled
                            </h4>
                            <p className="text-sm text-orange-700">
                              Enhance your backup security by enabling 2FA with Google Authenticator
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={setup2FA}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Shield className="w-4 h-4 mr-2 inline" />
                          Setup 2FA
                        </button>
                      </div>
                    </div>

                    {/* 2FA Setup Process */}
                    {qrCode && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Setup Google Authenticator</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Step 1: Scan QR Code</h5>
                            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 mb-4">
                              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                                <p className="text-sm text-gray-600 text-center">QR Code<br/>Placeholder</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              Open Google Authenticator and scan this QR code to add your account.
                            </p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Step 2: Enter Verification Code</h5>
                            <input
                              type="text"
                              placeholder="6-digit code"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-widest mb-4"
                              maxLength={6}
                            />
                            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                              <CheckCircle className="w-4 h-4 mr-2 inline" />
                              Verify and Enable 2FA
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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

export default BackupSyncManager;