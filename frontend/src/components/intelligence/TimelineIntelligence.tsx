'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Settings,
  RefreshCw,
  Eye,
  Users,
  Calendar,
  Gauge,
  Award,
  Lightbulb,
  Search,
  Filter,
  Download
} from 'lucide-react';
import {
  TimelineIntelligence as ITimelineIntelligence,
  MLModel,
  TimelinePrediction,
  ConfidenceInterval,
  RiskFactor,
  HistoricalPattern,
  TeamVelocityTrend,
  VelocityDataPoint,
  SeasonalFactor,
  Task,
  Project
} from '../../types';

interface TimelineIntelligenceProps {
  projectId: string;
  tasks: Task[];
  historicalData: Project[];
  onPredictionUpdate: (predictions: TimelinePrediction[]) => void;
}

const TimelineIntelligence: React.FC<TimelineIntelligenceProps> = ({
  projectId,
  tasks,
  historicalData,
  onPredictionUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'patterns' | 'velocity' | 'risks' | 'models'>('overview');
  const [intelligence, setIntelligence] = useState<ITimelineIntelligence | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('complexity_analysis');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [timeHorizon, setTimeHorizon] = useState('30_days');
  const [analysisFilter, setAnalysisFilter] = useState({
    taskTypes: [] as string[],
    priorities: [] as string[],
    agents: [] as string[]
  });

  useEffect(() => {
    initializeIntelligence();
  }, [projectId]);

  const initializeIntelligence = async () => {
    setIsAnalyzing(true);

    // Simulate ML model initialization and analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockIntelligence: ITimelineIntelligence = {
      id: `intelligence-${projectId}`,
      projectId,
      mlModel: {
        id: 'model-1',
        name: 'SENTRA Timeline Predictor v2.1',
        version: '2.1.3',
        type: 'complexity_analysis',
        accuracy: 0.87,
        lastTrainedAt: '2024-01-14T08:00:00Z',
        features: [
          'task_complexity_score',
          'historical_similar_tasks',
          'team_velocity_trend',
          'agent_performance_metrics',
          'dependency_chain_length',
          'code_change_volume',
          'testing_requirements',
          'external_dependencies',
          'seasonal_factors',
          'technical_debt_impact'
        ],
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32,
          hidden_layers: [128, 64, 32],
          dropout_rate: 0.2,
          regularization: 0.01
        }
      },
      predictions: generateMockPredictions(tasks),
      confidenceIntervals: generateConfidenceIntervals(tasks),
      riskFactors: generateRiskFactors(),
      historicalPatterns: generateHistoricalPatterns(),
      teamVelocity: generateTeamVelocityTrend()
    };

    setIntelligence(mockIntelligence);
    onPredictionUpdate(mockIntelligence.predictions);
    setIsAnalyzing(false);
  };

  const generateMockPredictions = (tasks: Task[]): TimelinePrediction[] => {
    return tasks.map(task => {
      const complexityScore = Math.random() * 100;
      const baseTime = task.estimatedTime || 8;
      const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const predictedDuration = Math.max(1, baseTime * (1 + variation));
      
      return {
        id: `prediction-${task.id}`,
        taskId: task.id,
        predictedDuration,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        complexityScore,
        factors: [
          {
            name: 'Historical Similarity',
            impact: Math.random() * 0.3 + 0.1,
            weight: 0.25,
            description: 'Based on similar tasks completed previously'
          },
          {
            name: 'Team Velocity',
            impact: Math.random() * 0.2 + 0.1,
            weight: 0.20,
            description: 'Current team performance trends'
          },
          {
            name: 'Task Complexity',
            impact: complexityScore / 100,
            weight: 0.30,
            description: 'Analyzed code complexity and requirements'
          },
          {
            name: 'Dependencies',
            impact: Math.random() * 0.25,
            weight: 0.15,
            description: 'Impact of task dependencies and blockers'
          },
          {
            name: 'Agent Experience',
            impact: Math.random() * 0.2 + 0.1,
            weight: 0.10,
            description: 'Assigned agent\'s experience with similar tasks'
          }
        ],
        createdAt: new Date().toISOString()
      };
    });
  };

  const generateConfidenceIntervals = (tasks: Task[]): ConfidenceInterval[] => {
    return tasks.map(task => {
      const baseTime = task.estimatedTime || 8;
      const uncertainty = Math.random() * 0.4 + 0.1; // 10-50% uncertainty
      
      return {
        taskId: task.id,
        lowerBound: Math.max(1, baseTime * (1 - uncertainty)),
        upperBound: baseTime * (1 + uncertainty),
        median: baseTime,
        confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
        methodology: ['monte_carlo', 'bootstrap', 'bayesian', 'historical'][Math.floor(Math.random() * 4)] as any
      };
    });
  };

  const generateRiskFactors = (): RiskFactor[] => {
    return [
      {
        id: 'risk-1',
        name: 'Technical Debt Accumulation',
        category: 'technical',
        severity: 'medium',
        probability: 0.65,
        impact: 0.8,
        riskScore: 0.52,
        mitigationStrategies: [
          'Schedule regular refactoring sessions',
          'Implement code quality gates',
          'Increase test coverage requirements'
        ],
        triggers: ['code_complexity_increase', 'test_coverage_decrease', 'review_time_increase']
      },
      {
        id: 'risk-2',
        name: 'External API Dependency Delays',
        category: 'external',
        severity: 'high',
        probability: 0.3,
        impact: 0.9,
        riskScore: 0.27,
        mitigationStrategies: [
          'Implement fallback mechanisms',
          'Create mock services for development',
          'Establish SLA monitoring'
        ],
        triggers: ['api_response_time_increase', 'external_service_downtime']
      },
      {
        id: 'risk-3',
        name: 'Team Capacity Overload',
        category: 'resource',
        severity: 'medium',
        probability: 0.45,
        impact: 0.7,
        riskScore: 0.315,
        mitigationStrategies: [
          'Redistribute workload across team members',
          'Prioritize critical path tasks',
          'Consider additional resources'
        ],
        triggers: ['velocity_decline', 'burnout_indicators', 'overtime_increase']
      },
      {
        id: 'risk-4',
        name: 'Scope Creep Risk',
        category: 'complexity',
        severity: 'high',
        probability: 0.55,
        impact: 0.85,
        riskScore: 0.467,
        mitigationStrategies: [
          'Implement strict change control process',
          'Regular stakeholder alignment meetings',
          'Clear requirement documentation'
        ],
        triggers: ['requirement_changes', 'stakeholder_feedback_volume']
      }
    ];
  };

  const generateHistoricalPatterns = (): HistoricalPattern[] => {
    return [
      {
        id: 'pattern-1',
        patternType: 'seasonal',
        description: 'Development velocity decreases by ~20% during holiday periods',
        confidence: 0.89,
        applicableContexts: ['team_velocity', 'task_completion'],
        timeframe: 'December-January, July-August',
        impact: -0.2,
        examples: [
          {
            projectId: 'proj-1',
            taskType: 'feature_development',
            actualDuration: 12,
            predictedDuration: 10,
            context: { period: 'december_2023', team_size: 5 },
            timestamp: '2023-12-15T00:00:00Z'
          },
          {
            projectId: 'proj-2',
            taskType: 'bug_fix',
            actualDuration: 6,
            predictedDuration: 4,
            context: { period: 'july_2023', team_size: 4 },
            timestamp: '2023-07-20T00:00:00Z'
          }
        ]
      },
      {
        id: 'pattern-2',
        patternType: 'cyclic',
        description: 'Frontend tasks take 30% longer on Mondays due to context switching',
        confidence: 0.76,
        applicableContexts: ['frontend_tasks', 'context_switching'],
        timeframe: 'Weekly - Mondays',
        impact: 0.3,
        examples: [
          {
            projectId: 'proj-3',
            taskType: 'frontend_component',
            actualDuration: 8,
            predictedDuration: 6,
            context: { day_of_week: 'monday', task_category: 'frontend' },
            timestamp: '2024-01-08T00:00:00Z'
          }
        ]
      },
      {
        id: 'pattern-3',
        patternType: 'trend',
        description: 'Code review time has been steadily increasing (15% over 3 months)',
        confidence: 0.92,
        applicableContexts: ['code_review', 'quality_assurance'],
        timeframe: 'Last 3 months',
        impact: 0.15,
        examples: [
          {
            projectId: 'proj-4',
            taskType: 'code_review',
            actualDuration: 4,
            predictedDuration: 3.5,
            context: { review_complexity: 'medium', files_changed: 15 },
            timestamp: '2024-01-10T00:00:00Z'
          }
        ]
      }
    ];
  };

  const generateTeamVelocityTrend = (): TeamVelocityTrend => {
    const generateVelocityData = (count: number): VelocityDataPoint[] => {
      return Array.from({ length: count }, (_, i) => ({
        period: `Week ${count - i}`,
        velocity: Math.random() * 20 + 30, // 30-50 story points
        tasksCompleted: Math.floor(Math.random() * 10) + 15, // 15-25 tasks
        totalEffort: Math.random() * 100 + 150, // 150-250 hours
        teamSize: Math.floor(Math.random() * 2) + 4, // 4-6 team members
        context: {
          holidays: i < 2 ? true : false,
          new_team_member: i === 3 ? true : false,
          major_release: i === 1 ? true : false
        }
      }));
    };

    return {
      teamId: 'team-1',
      currentVelocity: 42.5,
      historicalVelocity: generateVelocityData(12),
      seasonalFactors: [
        {
          period: 'weekly',
          factor: 0.85, // Mondays are slower
          confidence: 0.76,
          description: 'Monday productivity impact'
        },
        {
          period: 'monthly',
          factor: 0.9, // End of month pressure
          confidence: 0.68,
          description: 'Month-end delivery pressure'
        },
        {
          period: 'quarterly',
          factor: 1.1, // Quarter-end push
          confidence: 0.82,
          description: 'Quarter-end delivery acceleration'
        }
      ],
      trendDirection: 'increasing',
      volatility: 0.15,
      predictedVelocity: [
        { period: 'Next Week', predictedVelocity: 44, confidence: 0.85, factors: ['current_trend', 'team_stability'] },
        { period: 'Week +2', predictedVelocity: 45, confidence: 0.78, factors: ['seasonal_adjustment', 'capacity_planning'] },
        { period: 'Week +3', predictedVelocity: 43, confidence: 0.71, factors: ['regression_to_mean', 'uncertainty_increase'] },
        { period: 'Week +4', predictedVelocity: 46, confidence: 0.65, factors: ['projected_improvements', 'learning_curve'] }
      ]
    };
  };

  const retrainModel = async (modelType: string) => {
    setIsAnalyzing(true);
    
    // Simulate model retraining
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (intelligence) {
      const updatedModel: MLModel = {
        ...intelligence.mlModel,
        type: modelType as any,
        accuracy: Math.min(0.98, intelligence.mlModel.accuracy + Math.random() * 0.05),
        lastTrainedAt: new Date().toISOString(),
        version: `${intelligence.mlModel.version.split('.')[0]}.${parseInt(intelligence.mlModel.version.split('.')[1]) + 1}.0`
      };

      setIntelligence({
        ...intelligence,
        mlModel: updatedModel,
        predictions: generateMockPredictions(tasks)
      });
    }
    
    setIsAnalyzing(false);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Minus;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Brain },
    { id: 'predictions', name: 'Predictions', icon: Target },
    { id: 'patterns', name: 'Patterns', icon: Activity },
    { id: 'velocity', name: 'Team Velocity', icon: Gauge },
    { id: 'risks', name: 'Risk Factors', icon: AlertTriangle },
    { id: 'models', name: 'ML Models', icon: Settings }
  ];

  if (!intelligence && !isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <button
          onClick={initializeIntelligence}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Brain className="w-5 h-5 mr-2 inline" />
          Initialize Timeline Intelligence
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline Intelligence</h1>
          <p className="text-gray-600">Advanced ML-powered project timeline analysis and predictions</p>
        </div>
        <div className="flex items-center space-x-3">
          {intelligence && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Award className="w-4 h-4 mr-1" />
              {formatConfidence(intelligence.mlModel.accuracy)} Accuracy
            </span>
          )}
          <button
            onClick={() => retrainModel(selectedModel)}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 inline ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Training...' : 'Retrain Model'}
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
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Timeline Data</h3>
              <p className="text-gray-600">Training ML models and generating predictions...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  {/* Model Performance */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatConfidence(intelligence.mlModel.accuracy)}
                      </div>
                      <p className="text-sm text-gray-600">Prediction Accuracy</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Version:</span>
                          <span className="font-medium">{intelligence.mlModel.version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Features:</span>
                          <span className="font-medium">{intelligence.mlModel.features.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Predictions */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Predictions</h3>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-green-600">
                        {intelligence.predictions.length}
                      </div>
                      <p className="text-sm text-gray-600">Tasks Analyzed</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">High Confidence:</span>
                          <span className="font-medium">
                            {intelligence.predictions.filter(p => p.confidence > 0.8).length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Confidence:</span>
                          <span className="font-medium">
                            {formatConfidence(
                              intelligence.predictions.reduce((acc, p) => acc + p.confidence, 0) / intelligence.predictions.length
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-orange-600">
                        {intelligence.riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical').length}
                      </div>
                      <p className="text-sm text-gray-600">High Risk Factors</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Risks:</span>
                          <span className="font-medium">{intelligence.riskFactors.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Risk Score:</span>
                          <span className="font-medium">
                            {(intelligence.riskFactors.reduce((acc, r) => acc + r.riskScore, 0) / intelligence.riskFactors.length * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Velocity */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Velocity</h3>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-purple-600 flex items-center">
                        {intelligence.teamVelocity.currentVelocity}
                        {(() => {
                          const TrendIcon = getTrendIcon(intelligence.teamVelocity.trendDirection);
                          return <TrendIcon className="w-6 h-6 ml-2" />;
                        })()}
                      </div>
                      <p className="text-sm text-gray-600">Story Points/Week</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Trend:</span>
                          <span className="font-medium capitalize">{intelligence.teamVelocity.trendDirection}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Volatility:</span>
                          <span className="font-medium">{(intelligence.teamVelocity.volatility * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Predictions */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {intelligence.predictions.slice(0, 5).map(prediction => {
                        const task = tasks.find(t => t.id === prediction.taskId);
                        if (!task) return null;

                        return (
                          <div key={prediction.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  prediction.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                                  prediction.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {formatConfidence(prediction.confidence)} confidence
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Predicted Duration:</span>
                                <span className="ml-2 font-medium">{formatDuration(prediction.predictedDuration)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Complexity Score:</span>
                                <span className="ml-2 font-medium">{Math.round(prediction.complexityScore)}/100</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Primary Factor:</span>
                                <span className="ml-2 font-medium">
                                  {prediction.factors.reduce((max, factor) => factor.impact > max.impact ? factor : max).name}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick Insights */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-blue-900">Optimization Opportunity</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Tasks assigned to Sarah show 15% faster completion when scheduled in the morning.
                        Consider adjusting task scheduling for optimal productivity.
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-green-900">Trend Alert</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Team velocity has increased by 12% over the last month. Current trajectory suggests
                        project completion 2-3 days ahead of schedule.
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                        <h4 className="font-medium text-orange-900">Risk Warning</h4>
                      </div>
                      <p className="text-sm text-orange-700">
                        Scope creep risk detected: 3 tasks have expanded beyond initial estimates.
                        Consider implementing stricter change control processes.
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Users className="w-5 h-5 text-purple-600 mr-2" />
                        <h4 className="font-medium text-purple-900">Team Pattern</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Code review tasks consistently take 20% longer than estimated.
                        Consider allocating additional time for thorough reviews.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Task Predictions</h3>
                  <div className="flex items-center space-x-3">
                    <select
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0.5}>50%+ Confidence</option>
                      <option value={0.7}>70%+ Confidence</option>
                      <option value={0.8}>80%+ Confidence</option>
                      <option value={0.9}>90%+ Confidence</option>
                    </select>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      <Filter className="w-4 h-4 mr-1 inline" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {intelligence.predictions
                    .filter(p => p.confidence >= confidenceThreshold)
                    .map(prediction => {
                      const task = tasks.find(t => t.id === prediction.taskId);
                      const interval = intelligence.confidenceIntervals.find(i => i.taskId === prediction.taskId);
                      if (!task) return null;

                      return (
                        <div key={prediction.id} className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <span className="text-sm text-gray-600">Predicted Duration</span>
                                  <p className="font-semibold text-lg">{formatDuration(prediction.predictedDuration)}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Confidence</span>
                                  <p className="font-semibold text-lg">{formatConfidence(prediction.confidence)}</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Complexity</span>
                                  <p className="font-semibold text-lg">{Math.round(prediction.complexityScore)}/100</p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600">Range</span>
                                  <p className="font-semibold text-lg">
                                    {interval ? `${formatDuration(interval.lowerBound)}-${formatDuration(interval.upperBound)}` : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {/* Prediction Factors */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Contributing Factors</h5>
                                <div className="space-y-2">
                                  {prediction.factors.map((factor, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-gray-900">{factor.name}</span>
                                          <span className="text-sm text-gray-600">{Math.round(factor.impact * 100)}% impact</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${factor.impact * 100}%` }}
                                          />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="ml-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                prediction.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                                prediction.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {formatConfidence(prediction.confidence)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}

            {/* Add other tab contents here... */}
            {activeTab === 'patterns' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Historical Patterns</h3>
                
                <div className="space-y-6">
                  {intelligence.historicalPatterns.map(pattern => (
                    <div key={pattern.id} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                              pattern.patternType === 'seasonal' ? 'bg-blue-100 text-blue-800' :
                              pattern.patternType === 'cyclic' ? 'bg-green-100 text-green-800' :
                              pattern.patternType === 'trend' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {pattern.patternType}
                            </span>
                            <span className="text-sm text-gray-600">{pattern.timeframe}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{pattern.description}</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Impact: {pattern.impact > 0 ? '+' : ''}{Math.round(pattern.impact * 100)}% • 
                            Confidence: {formatConfidence(pattern.confidence)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Example Cases</h5>
                        <div className="space-y-2">
                          {pattern.examples.slice(0, 2).map((example, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Task:</span>
                                  <span className="ml-1 font-medium capitalize">{example.taskType.replace('_', ' ')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Predicted:</span>
                                  <span className="ml-1 font-medium">{formatDuration(example.predictedDuration)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Actual:</span>
                                  <span className="ml-1 font-medium">{formatDuration(example.actualDuration)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Variance:</span>
                                  <span className={`ml-1 font-medium ${
                                    example.actualDuration > example.predictedDuration ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {example.actualDuration > example.predictedDuration ? '+' : ''}
                                    {Math.round((example.actualDuration - example.predictedDuration) / example.predictedDuration * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'velocity' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Velocity Trend</h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="h-64 flex items-center justify-center text-gray-500">
                        <LineChart className="w-16 h-16 mr-4" />
                        <div>
                          <p className="font-medium">Velocity Chart</p>
                          <p className="text-sm">Interactive chart would be rendered here</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Current Velocity */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Current Velocity</h4>
                      <div className="text-3xl font-bold text-purple-600 flex items-center">
                        {intelligence.teamVelocity.currentVelocity}
                        {(() => {
                          const TrendIcon = getTrendIcon(intelligence.teamVelocity.trendDirection);
                          return <TrendIcon className="w-6 h-6 ml-2" />;
                        })()}
                      </div>
                      <p className="text-sm text-gray-600">Story Points per Week</p>
                    </div>

                    {/* Predicted Velocity */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Velocity Forecast</h4>
                      <div className="space-y-3">
                        {intelligence.teamVelocity.predictedVelocity.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{prediction.period}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{prediction.predictedVelocity}</span>
                              <span className="text-xs text-gray-500">
                                ({formatConfidence(prediction.confidence)})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seasonal Factors */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {intelligence.teamVelocity.seasonalFactors.map((factor, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">{factor.period}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-lg font-bold ${
                            factor.factor > 1 ? 'text-green-600' : 
                            factor.factor < 1 ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {factor.factor > 1 ? '+' : ''}{Math.round((factor.factor - 1) * 100)}%
                          </span>
                          <span className="text-sm text-gray-500">
                            ({formatConfidence(factor.confidence)})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Data */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Velocity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effort</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Size</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {intelligence.teamVelocity.historicalVelocity.slice(0, 8).map((data, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {data.period}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {data.velocity.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {data.tasksCompleted}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDuration(data.totalEffort)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {data.teamSize}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {Object.entries(data.context)
                                  .filter(([_, value]) => value)
                                  .map(([key]) => key.replace('_', ' '))
                                  .join(', ') || 'Normal'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'risks' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Factor Analysis</h3>
                
                <div className="space-y-6">
                  {intelligence.riskFactors
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .map(risk => (
                      <div key={risk.id} className={`border rounded-xl p-6 ${getRiskColor(risk.severity)}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{risk.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getRiskColor(risk.severity)}`}>
                                {risk.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 capitalize">{risk.category} risk</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <span className="text-sm text-gray-600">Probability</span>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-orange-500 h-2 rounded-full"
                                      style={{ width: `${risk.probability * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{Math.round(risk.probability * 100)}%</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Impact</span>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-red-500 h-2 rounded-full"
                                      style={{ width: `${risk.impact * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{Math.round(risk.impact * 100)}%</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Risk Score</span>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        risk.riskScore > 0.7 ? 'bg-red-600' :
                                        risk.riskScore > 0.4 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${risk.riskScore * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">{Math.round(risk.riskScore * 100)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Mitigation Strategies</h5>
                            <ul className="space-y-1">
                              {risk.mitigationStrategies.map((strategy, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-700">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {strategy}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Warning Triggers</h5>
                            <div className="flex flex-wrap gap-2">
                              {risk.triggers.map((trigger, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                                  {trigger.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'models' && intelligence && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Model Overview */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Model</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">{intelligence.mlModel.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Version:</span>
                            <span className="font-medium">{intelligence.mlModel.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">{intelligence.mlModel.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-medium">{formatConfidence(intelligence.mlModel.accuracy)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Trained:</span>
                            <span className="font-medium">
                              {new Date(intelligence.mlModel.lastTrainedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Prediction Accuracy</span>
                              <span className="text-sm font-medium">{formatConfidence(intelligence.mlModel.accuracy)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${intelligence.mlModel.accuracy * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Features:</span>
                              <span className="ml-2 font-medium">{intelligence.mlModel.features.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Training Data:</span>
                              <span className="ml-2 font-medium">15.2K samples</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Features */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Importance</h3>
                    <div className="space-y-3">
                      {intelligence.mlModel.features.map((feature, index) => {
                        const importance = Math.random(); // Mock importance
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {feature.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${importance * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-10 text-right">
                                {Math.round(importance * 100)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hyperparameters */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Hyperparameters</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(intelligence.mlModel.hyperparameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium">
                                {Array.isArray(value) ? `[${value.join(', ')}]` : value.toString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Model Actions</h4>
                        <div className="space-y-3">
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="complexity_analysis">Complexity Analysis</option>
                            <option value="time_prediction">Time Prediction</option>
                            <option value="risk_assessment">Risk Assessment</option>
                            <option value="velocity_forecasting">Velocity Forecasting</option>
                          </select>
                          <button
                            onClick={() => retrainModel(selectedModel)}
                            disabled={isAnalyzing}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 inline ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? 'Retraining...' : 'Retrain Model'}
                          </button>
                          <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4 mr-2 inline" />
                            Export Model
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TimelineIntelligence;