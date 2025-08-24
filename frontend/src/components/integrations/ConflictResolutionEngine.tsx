'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  GitMerge,
  GitBranch,
  Users,
  Bot,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Zap,
  FileText,
  Code,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Settings
} from 'lucide-react';
import {
  ConflictResolution,
  ConflictFile,
  ConflictMarker,
  ConflictSuggestion,
  PullRequest
} from '../../types';

interface ConflictResolutionEngineProps {
  projectId: string;
  conflicts: ConflictResolution[];
  onResolutionComplete: (resolutionId: string, resolution: ConflictResolution) => void;
  onRequestManualIntervention: (resolutionId: string) => void;
}

interface AIAnalysis {
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  complexityScore: number;
  recommendedStrategy: 'auto_accept_incoming' | 'auto_accept_current' | 'ai_assisted' | 'manual';
  reasoning: string;
  potentialImpacts: string[];
  requiredApprovals: string[];
}

const ConflictResolutionEngine: React.FC<ConflictResolutionEngineProps> = ({
  projectId,
  conflicts,
  onResolutionComplete,
  onRequestManualIntervention
}) => {
  const [activeConflict, setActiveConflict] = useState<ConflictResolution | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, AIAnalysis>>({});
  const [resolutionProgress, setResolutionProgress] = useState<Record<string, number>>({});
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ai_assisted');
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [previewContent, setPreviewContent] = useState<Record<string, string>>({});

  useEffect(() => {
    // Analyze all conflicts when they change
    conflicts.forEach(conflict => {
      if (!aiAnalysis[conflict.id] && !isAnalyzing[conflict.id]) {
        analyzeConflict(conflict);
      }
    });
  }, [conflicts]);

  const analyzeConflict = async (conflict: ConflictResolution) => {
    setIsAnalyzing(prev => ({ ...prev, [conflict.id]: true }));

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis: AIAnalysis = {
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      riskLevel: determineRiskLevel(conflict),
      complexityScore: calculateComplexityScore(conflict),
      recommendedStrategy: suggestResolutionStrategy(conflict),
      reasoning: generateReasoningText(conflict),
      potentialImpacts: identifyPotentialImpacts(conflict),
      requiredApprovals: determineRequiredApprovals(conflict)
    };

    setAiAnalysis(prev => ({ ...prev, [conflict.id]: analysis }));
    setIsAnalyzing(prev => ({ ...prev, [conflict.id]: false }));
  };

  const determineRiskLevel = (conflict: ConflictResolution): 'low' | 'medium' | 'high' => {
    const riskFactors = [
      conflict.conflictFiles.some(f => f.path.includes('config') || f.path.includes('env')),
      conflict.conflictFiles.some(f => f.path.includes('database') || f.path.includes('migration')),
      conflict.conflictFiles.some(f => f.path.includes('security') || f.path.includes('auth')),
      conflict.conflictFiles.length > 5,
      conflict.conflictFiles.some(f => f.conflictMarkers.length > 10)
    ];

    const riskCount = riskFactors.filter(Boolean).length;
    return riskCount >= 3 ? 'high' : riskCount >= 1 ? 'medium' : 'low';
  };

  const calculateComplexityScore = (conflict: ConflictResolution): number => {
    let score = 0;
    score += conflict.conflictFiles.length * 2;
    score += conflict.conflictFiles.reduce((acc, file) => acc + file.conflictMarkers.length, 0);
    score += conflict.conflictFiles.some(f => f.path.includes('.json') || f.path.includes('.yml')) ? 5 : 0;
    score += conflict.conflictFiles.some(f => f.path.includes('package.json')) ? 10 : 0;
    return Math.min(score, 100);
  };

  const suggestResolutionStrategy = (conflict: ConflictResolution): AIAnalysis['recommendedStrategy'] => {
    const riskLevel = determineRiskLevel(conflict);
    const complexity = calculateComplexityScore(conflict);
    
    if (riskLevel === 'high' || complexity > 50) return 'manual';
    if (complexity > 20) return 'ai_assisted';
    if (conflict.conflictFiles.every(f => f.conflictMarkers.length <= 3)) return 'auto_accept_incoming';
    return 'ai_assisted';
  };

  const generateReasoningText = (conflict: ConflictResolution): string => {
    const fileTypes = conflict.conflictFiles.map(f => f.path.split('.').pop()).filter(Boolean);
    const hasConfigFiles = conflict.conflictFiles.some(f => f.path.includes('config'));
    const conflictCount = conflict.conflictFiles.reduce((acc, file) => acc + file.conflictMarkers.length, 0);

    let reasoning = `Analysis of ${conflict.conflictFiles.length} conflicted files with ${conflictCount} conflict markers. `;
    
    if (hasConfigFiles) {
      reasoning += 'Configuration files detected - requires careful review. ';
    }
    
    if (fileTypes.includes('js') || fileTypes.includes('ts')) {
      reasoning += 'JavaScript/TypeScript conflicts detected - can apply semantic merge analysis. ';
    }
    
    if (conflictCount <= 5) {
      reasoning += 'Low conflict complexity suggests automated resolution is safe.';
    } else {
      reasoning += 'High conflict complexity recommends human oversight.';
    }

    return reasoning;
  };

  const identifyPotentialImpacts = (conflict: ConflictResolution): string[] => {
    const impacts: string[] = [];
    
    conflict.conflictFiles.forEach(file => {
      if (file.path.includes('package.json')) {
        impacts.push('Dependency version conflicts may affect build process');
      }
      if (file.path.includes('config')) {
        impacts.push('Configuration changes may affect runtime behavior');
      }
      if (file.path.includes('database') || file.path.includes('migration')) {
        impacts.push('Database schema changes require careful coordination');
      }
      if (file.path.includes('api') || file.path.includes('endpoint')) {
        impacts.push('API changes may affect client integrations');
      }
      if (file.path.includes('test')) {
        impacts.push('Test file conflicts may indicate functionality disputes');
      }
    });

    if (impacts.length === 0) {
      impacts.push('Standard code conflicts with minimal risk');
    }

    return Array.from(new Set(impacts)); // Remove duplicates
  };

  const determineRequiredApprovals = (conflict: ConflictResolution): string[] => {
    const approvals: string[] = [];
    const riskLevel = determineRiskLevel(conflict);
    
    if (riskLevel === 'high') {
      approvals.push('Senior Developer');
      approvals.push('Tech Lead');
    } else if (riskLevel === 'medium') {
      approvals.push('Senior Developer');
    }

    if (conflict.conflictFiles.some(f => f.path.includes('security'))) {
      approvals.push('Security Team');
    }
    
    if (conflict.conflictFiles.some(f => f.path.includes('database'))) {
      approvals.push('Database Administrator');
    }

    return Array.from(new Set(approvals));
  };

  const resolveConflict = async (conflict: ConflictResolution, strategy: string) => {
    setResolutionProgress(prev => ({ ...prev, [conflict.id]: 0 }));

    // Simulate resolution process with progress updates
    const steps = [
      { progress: 20, message: 'Analyzing conflict patterns...' },
      { progress: 40, message: 'Applying resolution strategy...' },
      { progress: 60, message: 'Validating syntax and structure...' },
      { progress: 80, message: 'Running automated tests...' },
      { progress: 100, message: 'Resolution complete!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setResolutionProgress(prev => ({ ...prev, [conflict.id]: step.progress }));
    }

    // Create resolved conflict
    const resolvedConflict: ConflictResolution = {
      ...conflict,
      status: 'resolved',
      resolutionStrategy: strategy as any,
      resolvedBy: 'AI Assistant',
      resolvedAt: new Date().toISOString(),
      aiSuggestions: generateAISuggestions(conflict)
    };

    onResolutionComplete(conflict.id, resolvedConflict);
  };

  const generateAISuggestions = (conflict: ConflictResolution): ConflictSuggestion[] => {
    return conflict.conflictFiles.map(file => ({
      file: file.path,
      resolution: `Merge both changes with semantic analysis for ${file.path}`,
      confidence: Math.random() * 0.2 + 0.8,
      reasoning: `Applied context-aware merging for ${file.conflictMarkers.length} conflict markers`
    }));
  };

  const previewResolution = async (conflict: ConflictResolution, strategy: string) => {
    // Simulate generating preview content
    const preview = conflict.conflictFiles.map(file => 
      `// Resolved ${file.path}\n// Strategy: ${strategy}\n// Conflicts: ${file.conflictMarkers.length}\n\n[Preview content would show resolved file here]`
    ).join('\n\n');
    
    setPreviewContent(prev => ({ ...prev, [conflict.id]: preview }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600';
      case 'resolving': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'resolving': return Clock;
      case 'failed': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Conflict Resolution Engine</h2>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {conflicts.filter(c => c.status === 'detected').length} Active
            </span>
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <Settings className="w-4 h-4 mr-1 inline" />
              Configure
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {conflicts.filter(c => c.status === 'detected').length}
            </div>
            <p className="text-sm text-gray-600">Pending Conflicts</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {conflicts.filter(c => c.status === 'resolving').length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {conflicts.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-sm text-gray-600">Resolved</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(aiAnalysis).reduce((acc, analysis) => acc + Math.round(analysis.confidence * 100), 0) / Object.keys(aiAnalysis).length || 0}%
            </div>
            <p className="text-sm text-gray-600">Avg Confidence</p>
          </div>
        </div>
      </div>

      {/* Active Conflicts */}
      <div className="space-y-4">
        {conflicts.map(conflict => {
          const StatusIcon = getStatusIcon(conflict.status);
          const analysis = aiAnalysis[conflict.id];
          const progress = resolutionProgress[conflict.id];
          const isAnalyzingConflict = isAnalyzing[conflict.id];

          return (
            <div key={conflict.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <StatusIcon className={`w-6 h-6 ${getStatusColor(conflict.status)}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Pull Request #{conflict.pullRequestId}</h3>
                    <p className="text-sm text-gray-600">
                      {conflict.conflictFiles.length} files • {conflict.conflictFiles.reduce((acc, file) => acc + file.conflictMarkers.length, 0)} conflicts
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    conflict.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    conflict.status === 'resolving' ? 'bg-blue-100 text-blue-800' :
                    conflict.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {conflict.status}
                  </span>
                  {analysis && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.riskLevel} risk
                    </span>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              {isAnalyzingConflict ? (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 text-blue-500 mr-2 animate-pulse" />
                    <span className="text-sm text-blue-700">AI is analyzing conflict patterns...</span>
                  </div>
                </div>
              ) : analysis && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Bot className="w-4 h-4 mr-1 text-blue-500" />
                        AI Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Complexity:</span>
                          <span className="font-medium">{analysis.complexityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Strategy:</span>
                          <span className="font-medium capitalize">{analysis.recommendedStrategy.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Reasoning</h4>
                      <p className="text-sm text-gray-600">{analysis.reasoning}</p>
                    </div>
                  </div>

                  {analysis.potentialImpacts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Potential Impacts</h4>
                      <div className="space-y-1">
                        {analysis.potentialImpacts.map((impact, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <ArrowRight className="w-3 h-3 mr-2" />
                            {impact}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.requiredApprovals.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Required Approvals</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.requiredApprovals.map((approval, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            {approval}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conflict Files */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Conflicted Files</h4>
                <div className="space-y-2">
                  {conflict.conflictFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{file.path}</p>
                          <p className="text-xs text-gray-600">{file.conflictMarkers.length} conflict markers</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.suggestedResolution && (
                          <button
                            onClick={() => {/* Show AI suggestion */}}
                            className="p-1 text-blue-500 hover:text-blue-600"
                            title="View AI suggestion"
                          >
                            <Bot className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {/* View file */}}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View file"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Progress */}
              {typeof progress === 'number' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Resolution Progress</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {conflict.status === 'detected' && analysis && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ai_assisted">AI Assisted</option>
                      <option value="auto_accept_incoming">Accept Incoming</option>
                      <option value="auto_accept_current">Accept Current</option>
                      <option value="manual">Manual Resolution</option>
                    </select>
                    <button
                      onClick={() => previewResolution(conflict, selectedStrategy)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1 inline" />
                      Preview
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {analysis.riskLevel === 'high' ? (
                      <button
                        onClick={() => onRequestManualIntervention(conflict.id)}
                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-1 inline" />
                        Request Manual Review
                      </button>
                    ) : (
                      <button
                        onClick={() => resolveConflict(conflict, selectedStrategy)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Zap className="w-4 h-4 mr-1 inline" />
                        Resolve Automatically
                      </button>
                    )}
                  </div>
                </div>
              )}

              {conflict.status === 'resolved' && conflict.aiSuggestions && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolution Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Resolved by:</span>
                      <span className="font-medium">{conflict.resolvedBy}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Strategy used:</span>
                      <span className="font-medium capitalize">{conflict.resolutionStrategy?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Resolved at:</span>
                      <span className="font-medium">{new Date(conflict.resolvedAt!).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-green-700">
                      AI successfully resolved {conflict.aiSuggestions.length} file conflicts with an average confidence of{' '}
                      {Math.round(conflict.aiSuggestions.reduce((acc, s) => acc + s.confidence, 0) / conflict.aiSuggestions.length * 100)}%.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Content */}
              {previewContent[conflict.id] && (
                <div className="mt-4 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-40 overflow-y-auto">
                  <pre>{previewContent[conflict.id]}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {conflicts.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Conflicts Detected</h3>
          <p className="text-gray-600">All pull requests are merge-ready. The AI engine is monitoring for new conflicts.</p>
        </div>
      )}
    </div>
  );
};

export default ConflictResolutionEngine;