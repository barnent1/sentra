'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Tag,
  Target,
  FileText,
  Code,
  Zap
} from 'lucide-react';
import {
  Decision,
  GitHubIssue,
  GitHubLabel,
  FollowupAction,
  Task
} from '../../types';

interface DecisionToEpicConverterProps {
  decision: Decision;
  onEpicCreated: (epic: GitHubIssue, tasks: Task[]) => void;
  onClose: () => void;
}

interface EpicTemplate {
  title: string;
  body: string;
  labels: GitHubLabel[];
  assignees: string[];
  milestone?: string;
  estimatedStoryPoints: number;
  suggestedTasks: TaskTemplate[];
}

interface TaskTemplate {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  assignedAgent?: string;
  dependencies: string[];
  tags: string[];
}

const DecisionToEpicConverter: React.FC<DecisionToEpicConverterProps> = ({
  decision,
  onEpicCreated,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<'analyze' | 'configure' | 'review' | 'create'>('analyze');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [epicTemplate, setEpicTemplate] = useState<EpicTemplate | null>(null);
  const [customization, setCustomization] = useState({
    includeUserStories: true,
    createTaskBreakdown: true,
    assignToAgents: true,
    setMilestone: true,
    addLabels: true,
    estimateEffort: true
  });
  
  const [availableAgents] = useState([
    { id: 'james', name: 'James (Lead Developer)', capabilities: ['architecture', 'backend', 'review'] },
    { id: 'sarah', name: 'Sarah (Frontend Expert)', capabilities: ['frontend', 'ui', 'testing'] },
    { id: 'mike', name: 'Mike (DevOps)', capabilities: ['deployment', 'infrastructure', 'security'] }
  ]);

  const [availableLabels] = useState<GitHubLabel[]>([
    { id: '1', name: 'epic', color: '8B5CF6', description: 'Large feature spanning multiple stories' },
    { id: '2', name: 'high-priority', color: 'DC2626', description: 'High priority item' },
    { id: '3', name: 'medium-priority', color: 'F59E0B', description: 'Medium priority item' },
    { id: '4', name: 'low-priority', color: '10B981', description: 'Low priority item' },
    { id: '5', name: 'frontend', color: '3B82F6', description: 'Frontend development' },
    { id: '6', name: 'backend', color: '8B5CF6', description: 'Backend development' },
    { id: '7', name: 'infrastructure', color: '6B7280', description: 'Infrastructure and DevOps' },
    { id: '8', name: 'security', color: 'EF4444', description: 'Security related' },
    { id: '9', name: 'performance', color: 'F97316', description: 'Performance optimization' },
    { id: '10', name: 'testing', color: '059669', description: 'Testing and QA' }
  ]);

  useEffect(() => {
    if (currentStep === 'analyze') {
      analyzeDecision();
    }
  }, [currentStep]);

  const analyzeDecision = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis of the decision
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate epic template based on decision
    const template: EpicTemplate = {
      title: `Epic: ${decision.title}`,
      body: generateEpicDescription(decision),
      labels: selectRelevantLabels(decision),
      assignees: suggestAssignees(decision),
      milestone: suggestMilestone(decision),
      estimatedStoryPoints: estimateComplexity(decision),
      suggestedTasks: generateTaskTemplates(decision)
    };
    
    setEpicTemplate(template);
    setIsAnalyzing(false);
    setCurrentStep('configure');
  };

  const generateEpicDescription = (decision: Decision): string => {
    return `## Overview
${decision.description}

## Decision Rationale
${decision.rationale}

## Impact Assessment
- **Impact Level**: ${decision.impact}
- **Decided By**: ${decision.decidedBy}
- **Decision Date**: ${new Date(decision.timestamp).toLocaleDateString()}

## Acceptance Criteria
- [ ] All technical requirements are implemented
- [ ] Quality gates are passed (tests, security, performance)
- [ ] Documentation is updated
- [ ] Deployment is successful across all environments

## Follow-up Actions
${decision.followupActions.map(action => `- [ ] ${action.description} (Due: ${new Date(action.dueDate).toLocaleDateString()})`).join('\n')}

## Definition of Done
- [ ] Code review completed by senior team member
- [ ] All tests passing with minimum 80% coverage
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Stakeholder approval received

---
*This epic was automatically generated from Decision #${decision.id} on ${new Date().toLocaleDateString()}*`;
  };

  const selectRelevantLabels = (decision: Decision): GitHubLabel[] => {
    const labels: GitHubLabel[] = [
      availableLabels.find(l => l.name === 'epic')!
    ];

    // Add priority label based on impact
    const priorityMap = {
      'critical': 'high-priority',
      'high': 'high-priority',
      'medium': 'medium-priority',
      'low': 'low-priority'
    };
    const priorityLabel = availableLabels.find(l => l.name === priorityMap[decision.impact]);
    if (priorityLabel) labels.push(priorityLabel);

    // Add technical labels based on decision content
    const content = (decision.title + ' ' + decision.description + ' ' + decision.rationale).toLowerCase();
    
    if (content.includes('frontend') || content.includes('ui') || content.includes('interface')) {
      labels.push(availableLabels.find(l => l.name === 'frontend')!);
    }
    if (content.includes('backend') || content.includes('api') || content.includes('database')) {
      labels.push(availableLabels.find(l => l.name === 'backend')!);
    }
    if (content.includes('security') || content.includes('auth') || content.includes('encryption')) {
      labels.push(availableLabels.find(l => l.name === 'security')!);
    }
    if (content.includes('performance') || content.includes('optimization') || content.includes('speed')) {
      labels.push(availableLabels.find(l => l.name === 'performance')!);
    }
    if (content.includes('deploy') || content.includes('infrastructure') || content.includes('devops')) {
      labels.push(availableLabels.find(l => l.name === 'infrastructure')!);
    }

    return labels.filter(Boolean);
  };

  const suggestAssignees = (decision: Decision): string[] => {
    const assignees: string[] = [];
    const content = (decision.title + ' ' + decision.description + ' ' + decision.rationale).toLowerCase();
    
    // Suggest based on content and agent capabilities
    if (content.includes('frontend') || content.includes('ui')) {
      assignees.push('sarah');
    }
    if (content.includes('backend') || content.includes('architecture')) {
      assignees.push('james');
    }
    if (content.includes('deploy') || content.includes('infrastructure') || content.includes('security')) {
      assignees.push('mike');
    }
    
    // Always include lead for high impact decisions
    if (decision.impact === 'critical' || decision.impact === 'high') {
      if (!assignees.includes('james')) {
        assignees.push('james');
      }
    }

    return assignees;
  };

  const suggestMilestone = (decision: Decision): string => {
    // Suggest milestone based on impact and complexity
    if (decision.impact === 'critical') return 'v2.0.0';
    if (decision.impact === 'high') return 'v1.1.0';
    return 'v1.0.1';
  };

  const estimateComplexity = (decision: Decision): number => {
    const content = (decision.title + ' ' + decision.description + ' ' + decision.rationale).toLowerCase();
    let points = 3; // Base points
    
    // Add complexity based on content analysis
    if (content.includes('database') || content.includes('migration')) points += 5;
    if (content.includes('security') || content.includes('authentication')) points += 3;
    if (content.includes('integration') || content.includes('api')) points += 2;
    if (content.includes('ui') || content.includes('frontend')) points += 2;
    if (content.includes('testing') || content.includes('automation')) points += 1;
    
    // Adjust based on impact
    const impactMultiplier = {
      'critical': 1.5,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    };
    
    points = Math.round(points * impactMultiplier[decision.impact]);
    
    // Adjust based on follow-up actions count
    points += Math.min(decision.followupActions.length, 5);
    
    return Math.max(1, Math.min(points, 21)); // Fibonacci-like scale: 1,2,3,5,8,13,21
  };

  const generateTaskTemplates = (decision: Decision): TaskTemplate[] => {
    const tasks: TaskTemplate[] = [];
    const content = (decision.title + ' ' + decision.description + ' ' + decision.rationale).toLowerCase();
    
    // Research and Planning Phase
    tasks.push({
      title: 'Technical Research and Requirements Analysis',
      description: `Research technical requirements and create detailed specifications for: ${decision.title}`,
      priority: 'high',
      estimatedTime: 4,
      assignedAgent: 'james',
      dependencies: [],
      tags: ['research', 'planning']
    });

    // Design Phase
    if (content.includes('ui') || content.includes('frontend') || content.includes('interface')) {
      tasks.push({
        title: 'UI/UX Design and Wireframes',
        description: 'Create user interface designs, wireframes, and user experience flows',
        priority: 'high',
        estimatedTime: 6,
        assignedAgent: 'sarah',
        dependencies: ['Technical Research and Requirements Analysis'],
        tags: ['design', 'frontend', 'ui']
      });
    }

    // Architecture Phase
    if (content.includes('backend') || content.includes('database') || content.includes('api')) {
      tasks.push({
        title: 'System Architecture and Database Design',
        description: 'Design system architecture, database schemas, and API specifications',
        priority: 'high',
        estimatedTime: 8,
        assignedAgent: 'james',
        dependencies: ['Technical Research and Requirements Analysis'],
        tags: ['architecture', 'backend', 'database']
      });
    }

    // Development Tasks
    if (content.includes('frontend')) {
      tasks.push({
        title: 'Frontend Component Development',
        description: 'Implement frontend components and user interface elements',
        priority: 'medium',
        estimatedTime: 12,
        assignedAgent: 'sarah',
        dependencies: ['UI/UX Design and Wireframes'],
        tags: ['development', 'frontend', 'components']
      });
    }

    if (content.includes('backend') || content.includes('api')) {
      tasks.push({
        title: 'Backend API Development',
        description: 'Implement backend APIs, business logic, and data access layers',
        priority: 'medium',
        estimatedTime: 16,
        assignedAgent: 'james',
        dependencies: ['System Architecture and Database Design'],
        tags: ['development', 'backend', 'api']
      });
    }

    // Security Phase
    if (content.includes('security') || content.includes('auth') || decision.impact === 'critical') {
      tasks.push({
        title: 'Security Implementation and Audit',
        description: 'Implement security measures, authentication, and conduct security audit',
        priority: 'high',
        estimatedTime: 6,
        assignedAgent: 'mike',
        dependencies: ['Backend API Development'],
        tags: ['security', 'audit', 'authentication']
      });
    }

    // Testing Phase
    tasks.push({
      title: 'Comprehensive Testing Suite',
      description: 'Develop and execute unit tests, integration tests, and end-to-end tests',
      priority: 'medium',
      estimatedTime: 8,
      assignedAgent: 'sarah',
      dependencies: ['Frontend Component Development', 'Backend API Development'],
      tags: ['testing', 'quality-assurance']
    });

    // Deployment Phase
    tasks.push({
      title: 'Deployment and Infrastructure Setup',
      description: 'Set up deployment pipelines, configure environments, and deploy to production',
      priority: 'medium',
      estimatedTime: 4,
      assignedAgent: 'mike',
      dependencies: ['Comprehensive Testing Suite'],
      tags: ['deployment', 'infrastructure', 'devops']
    });

    // Documentation
    tasks.push({
      title: 'Documentation and Knowledge Transfer',
      description: 'Create comprehensive documentation and conduct knowledge transfer sessions',
      priority: 'low',
      estimatedTime: 3,
      assignedAgent: 'james',
      dependencies: ['Deployment and Infrastructure Setup'],
      tags: ['documentation', 'knowledge-transfer']
    });

    // Add follow-up action tasks
    decision.followupActions.forEach((action, index) => {
      tasks.push({
        title: `Follow-up: ${action.description}`,
        description: `Complete follow-up action: ${action.description}`,
        priority: 'medium',
        estimatedTime: 2,
        assignedAgent: action.assignedTo,
        dependencies: ['Documentation and Knowledge Transfer'],
        tags: ['follow-up', 'post-implementation']
      });
    });

    return tasks;
  };

  const updateEpicTemplate = (field: keyof EpicTemplate, value: any) => {
    if (epicTemplate) {
      setEpicTemplate({
        ...epicTemplate,
        [field]: value
      });
    }
  };

  const updateTaskTemplate = (index: number, field: keyof TaskTemplate, value: any) => {
    if (epicTemplate) {
      const updatedTasks = epicTemplate.suggestedTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      );
      setEpicTemplate({
        ...epicTemplate,
        suggestedTasks: updatedTasks
      });
    }
  };

  const removeTask = (index: number) => {
    if (epicTemplate) {
      const updatedTasks = epicTemplate.suggestedTasks.filter((_, i) => i !== index);
      setEpicTemplate({
        ...epicTemplate,
        suggestedTasks: updatedTasks
      });
    }
  };

  const addTask = () => {
    if (epicTemplate) {
      const newTask: TaskTemplate = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        estimatedTime: 2,
        dependencies: [],
        tags: []
      };
      setEpicTemplate({
        ...epicTemplate,
        suggestedTasks: [...epicTemplate.suggestedTasks, newTask]
      });
    }
  };

  const createEpicAndTasks = async () => {
    if (!epicTemplate) return;

    setCurrentStep('create');

    // Simulate API calls to create GitHub issue and tasks
    await new Promise(resolve => setTimeout(resolve, 2000));

    const epic: GitHubIssue = {
      id: `epic-${Date.now()}`,
      number: Math.floor(Math.random() * 1000) + 100,
      title: epicTemplate.title,
      body: epicTemplate.body,
      state: 'open',
      labels: epicTemplate.labels,
      assignees: epicTemplate.assignees,
      milestone: epicTemplate.milestone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      linkedDecision: decision.id
    };

    const tasks: Task[] = epicTemplate.suggestedTasks.map((template, index) => ({
      id: `task-${Date.now()}-${index}`,
      projectId: 'current-project',
      agentId: template.assignedAgent || 'unassigned',
      title: template.title,
      description: template.description,
      status: 'pending',
      priority: template.priority,
      estimatedTime: template.estimatedTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dependencies: template.dependencies,
      tags: template.tags
    }));

    onEpicCreated(epic, tasks);
  };

  const steps = [
    { id: 'analyze', name: 'Analyze Decision', icon: Target },
    { id: 'configure', name: 'Configure Epic', icon: Edit2 },
    { id: 'review', name: 'Review & Customize', icon: CheckCircle },
    { id: 'create', name: 'Create Epic', icon: Zap }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Convert Decision to GitHub Epic</h2>
            <p className="text-gray-600">Transform your decision into a trackable GitHub epic with automated task breakdown</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'current' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 font-medium ${
                    status === 'current' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {currentStep === 'analyze' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Decision Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Original Decision</h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <p className="font-semibold">{decision.title}</p>
                          <p className="text-sm text-gray-600">{decision.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Impact: {decision.impact}</span>
                            <span>By: {decision.decidedBy}</span>
                            <span>{new Date(decision.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Analysis Progress</h4>
                        <div className="space-y-3">
                          {isAnalyzing ? (
                            <>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-blue-500 mr-2 animate-spin" />
                                <span className="text-sm">Analyzing decision content...</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-blue-500 mr-2 animate-spin" />
                                <span className="text-sm">Suggesting epic structure...</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-blue-500 mr-2 animate-spin" />
                                <span className="text-sm">Breaking down into tasks...</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm">Content analysis complete</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm">Epic template generated</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm">Task breakdown created</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'configure' && epicTemplate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Epic Configuration */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Epic Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Epic Title</label>
                        <input
                          type="text"
                          value={epicTemplate.title}
                          onChange={(e) => updateEpicTemplate('title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={epicTemplate.body}
                          onChange={(e) => updateEpicTemplate('body', e.target.value)}
                          rows={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {availableLabels.map(label => (
                              <label key={label.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={epicTemplate.labels.some(l => l.id === label.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateEpicTemplate('labels', [...epicTemplate.labels, label]);
                                    } else {
                                      updateEpicTemplate('labels', epicTemplate.labels.filter(l => l.id !== label.id));
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span
                                  className="px-2 py-1 text-xs rounded-full text-white"
                                  style={{ backgroundColor: `#${label.color}` }}
                                >
                                  {label.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
                          <div className="space-y-2">
                            {availableAgents.map(agent => (
                              <label key={agent.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={epicTemplate.assignees.includes(agent.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateEpicTemplate('assignees', [...epicTemplate.assignees, agent.id]);
                                    } else {
                                      updateEpicTemplate('assignees', epicTemplate.assignees.filter(a => a !== agent.id));
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">{agent.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Milestone</label>
                          <select
                            value={epicTemplate.milestone || ''}
                            onChange={(e) => updateEpicTemplate('milestone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">No milestone</option>
                            <option value="v1.0.0">v1.0.0</option>
                            <option value="v1.0.1">v1.0.1</option>
                            <option value="v1.1.0">v1.1.0</option>
                            <option value="v2.0.0">v2.0.0</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Task Breakdown</h3>
                      <button
                        onClick={addTask}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1 inline" />
                        Add Task
                      </button>
                    </div>
                    <div className="space-y-4">
                      {epicTemplate.suggestedTasks.map((task, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTaskTemplate(index, 'title', e.target.value)}
                                className="w-full font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                                placeholder="Task title"
                              />
                              <textarea
                                value={task.description}
                                onChange={(e) => updateTaskTemplate(index, 'description', e.target.value)}
                                className="w-full text-sm text-gray-600 bg-transparent border-none p-0 mt-1 focus:ring-0 resize-none"
                                placeholder="Task description"
                                rows={2}
                              />
                            </div>
                            <button
                              onClick={() => removeTask(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={task.priority}
                                onChange={(e) => updateTaskTemplate(index, 'priority', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                              <input
                                type="number"
                                value={task.estimatedTime}
                                onChange={(e) => updateTaskTemplate(index, 'estimatedTime', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="1"
                                max="40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Agent</label>
                              <select
                                value={task.assignedAgent || ''}
                                onChange={(e) => updateTaskTemplate(index, 'assignedAgent', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Unassigned</option>
                                {availableAgents.map(agent => (
                                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                              <div className="flex flex-wrap gap-1">
                                {task.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && epicTemplate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Epic Creation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{epicTemplate.suggestedTasks.length}</div>
                        <p className="text-sm text-gray-600">Tasks Generated</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{epicTemplate.estimatedStoryPoints}</div>
                        <p className="text-sm text-gray-600">Story Points</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {epicTemplate.suggestedTasks.reduce((acc, task) => acc + task.estimatedTime, 0)}h
                        </div>
                        <p className="text-sm text-gray-600">Estimated Effort</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Epic Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Title:</span>
                          <span className="font-medium">{epicTemplate.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Milestone:</span>
                          <span className="font-medium">{epicTemplate.milestone || 'None'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Assignees:</span>
                          <div className="flex space-x-2">
                            {epicTemplate.assignees.map(assignee => (
                              <span key={assignee} className="px-2 py-1 text-xs bg-gray-100 rounded">
                                {availableAgents.find(a => a.id === assignee)?.name || assignee}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-gray-600">Labels:</span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {epicTemplate.labels.map(label => (
                              <span
                                key={label.id}
                                className="px-2 py-1 text-xs rounded text-white"
                                style={{ backgroundColor: `#${label.color}` }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Task Distribution</h4>
                      <div className="space-y-3">
                        {availableAgents.map(agent => {
                          const agentTasks = epicTemplate.suggestedTasks.filter(t => t.assignedAgent === agent.id);
                          const totalHours = agentTasks.reduce((acc, task) => acc + task.estimatedTime, 0);
                          return (
                            <div key={agent.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="font-medium">{agent.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {agentTasks.length} tasks • {totalHours}h
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'create' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Epic and Tasks</h3>
                  <p className="text-gray-600 mb-4">Setting up GitHub integration and generating project structure...</p>
                  <div className="inline-flex items-center text-blue-600">
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    <span>Processing...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {currentStep === 'analyze' && 'AI is analyzing your decision to create an optimal epic structure'}
            {currentStep === 'configure' && 'Customize the epic and task breakdown to match your requirements'}
            {currentStep === 'review' && 'Review the final epic configuration before creating'}
            {currentStep === 'create' && 'Creating GitHub epic and project tasks...'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {currentStep === 'configure' && (
              <button
                onClick={() => setCurrentStep('review')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Review Epic
              </button>
            )}
            {currentStep === 'review' && (
              <button
                onClick={createEpicAndTasks}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Zap className="w-4 h-4 mr-2 inline" />
                Create Epic & Tasks
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionToEpicConverter;