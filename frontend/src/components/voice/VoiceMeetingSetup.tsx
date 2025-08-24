'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PlayIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore, useProjects } from '@/stores/dashboardStore';
import { VoiceMeeting, VoiceParticipant, VoicePersona } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const aiPersonas: VoicePersona[] = [
  {
    name: 'Strategy Advisor',
    voice: 'professional-female',
    personality: 'professional',
    expertise: ['strategic planning', 'business analysis', 'decision making'],
    communicationStyle: 'analytical'
  },
  {
    name: 'Tech Lead',
    voice: 'confident-male',
    personality: 'technical',
    expertise: ['software architecture', 'technical strategy', 'team coordination'],
    communicationStyle: 'direct'
  },
  {
    name: 'Creative Director',
    voice: 'warm-female',
    personality: 'creative',
    expertise: ['user experience', 'design thinking', 'innovation'],
    communicationStyle: 'collaborative'
  },
  {
    name: 'Project Manager',
    voice: 'friendly-male',
    personality: 'conversational',
    expertise: ['project management', 'timeline planning', 'resource allocation'],
    communicationStyle: 'supportive'
  }
];

const meetingTypes = [
  {
    id: 'project-planning',
    title: 'Project Planning Session',
    description: 'Plan new projects, define scope, and set milestones',
    duration: '30-45 min',
    participants: ['Strategy Advisor', 'Project Manager'],
    icon: DocumentTextIcon
  },
  {
    id: 'technical-review',
    title: 'Technical Architecture Review',
    description: 'Discuss technical decisions and architecture choices',
    duration: '45-60 min',
    participants: ['Tech Lead', 'Strategy Advisor'],
    icon: ChatBubbleLeftRightIcon
  },
  {
    id: 'creative-brainstorm',
    title: 'Creative Brainstorming',
    description: 'Generate ideas and explore innovative solutions',
    duration: '20-30 min',
    participants: ['Creative Director', 'Strategy Advisor'],
    icon: UserGroupIcon
  },
  {
    id: 'custom',
    title: 'Custom Meeting',
    description: 'Design your own meeting with selected AI participants',
    duration: 'Variable',
    participants: ['Customizable'],
    icon: MicrophoneIcon
  }
];

export function VoiceMeetingSetup() {
  const [selectedType, setSelectedType] = useState('project-planning');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  const { startVoiceMeeting } = useDashboardStore();
  const projects = useProjects();

  const handleParticipantToggle = (personaName: string) => {
    setSelectedParticipants(prev => 
      prev.includes(personaName)
        ? prev.filter(p => p !== personaName)
        : [...prev, personaName]
    );
  };

  const startMeeting = () => {
    const meetingType = meetingTypes.find(t => t.id === selectedType);
    const isCustom = selectedType === 'custom';
    
    const participants: VoiceParticipant[] = [
      // User participant
      {
        id: 'user-1',
        name: 'You',
        type: 'human',
        persona: {
          name: 'User',
          voice: 'user',
          personality: 'conversational',
          expertise: ['project management'],
          communicationStyle: 'collaborative'
        },
        status: 'joined'
      },
      // AI participants
      ...(isCustom ? selectedParticipants : meetingType?.participants || [])
        .map(participantName => {
          const persona = aiPersonas.find(p => p.name === participantName);
          if (!persona) return null;
          
          return {
            id: `ai-${persona.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: persona.name,
            type: 'agent' as const,
            persona,
            status: 'joined' as const
          };
        })
        .filter(Boolean) as VoiceParticipant[]
    ];

    const meeting: VoiceMeeting = {
      id: uuidv4(),
      title: isCustom ? customTitle : meetingType?.title || '',
      description: isCustom ? customDescription : meetingType?.description || '',
      participants,
      status: 'in_progress',
      startTime: new Date().toISOString(),
      decisions: [],
      transcript: [],
      context: {
        projectId: selectedProject,
        meetingType: selectedType,
        objectives: []
      }
    };

    startVoiceMeeting(meeting);
  };

  const canStart = selectedType !== 'custom' || 
    (customTitle.trim() && selectedParticipants.length > 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Meeting Types */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Meeting Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetingTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <motion.div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {type.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {type.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">{type.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UserGroupIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">
                            {type.participants.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Custom Meeting Configuration */}
        {selectedType === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-lg p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Custom Meeting Setup
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Describe the meeting purpose and goals"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select AI Participants
                </label>
                <div className="space-y-2">
                  {aiPersonas.map((persona) => (
                    <div
                      key={persona.name}
                      onClick={() => handleParticipantToggle(persona.name)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedParticipants.includes(persona.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {persona.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {persona.expertise.join(', ')}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 ${
                          selectedParticipants.includes(persona.name)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedParticipants.includes(persona.name) && (
                            <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Project Context */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Context (Optional)
          </h3>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a project for context</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          
          <p className="text-sm text-gray-500 mt-1">
            Providing project context helps AI participants give more relevant insights
          </p>
        </div>

        {/* Start Meeting Button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={startMeeting}
            disabled={!canStart}
            className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
              canStart
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PlayIcon className="w-5 h-5" />
            <span>Start Voice Meeting</span>
          </button>
        </div>
      </div>
    </div>
  );
}