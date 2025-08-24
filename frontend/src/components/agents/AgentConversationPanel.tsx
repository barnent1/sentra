'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ComputerDesktopIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/stores/dashboardStore';
import { AgentConversation, ConversationMessage } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

// Mock conversation data
const mockConversations: AgentConversation[] = [
  {
    id: 'conv-1',
    projectId: 'proj-1',
    participants: ['james-1', 'sarah-1'],
    topic: 'API Integration Discussion',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    messages: [
      {
        id: 'msg-1',
        senderId: 'james-1',
        senderName: 'James',
        content: 'Hey Sarah, I am working on the checkout flow and need to integrate with the payment API you built. Can you share the endpoint details?',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: 'msg-2',
        senderId: 'sarah-1',
        senderName: 'Sarah',
        content: 'Sure! The payment endpoint is at `/api/v1/payments`. Here is the structure:',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString()
      },
      {
        id: 'msg-3',
        senderId: 'sarah-1',
        senderName: 'Sarah',
        content: `POST /api/v1/payments
{
  "amount": 1000,
  "currency": "USD",
  "paymentMethod": "card",
  "metadata": {
    "orderId": "order_123"
  }
}`,
        type: 'code',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString()
      },
      {
        id: 'msg-4',
        senderId: 'james-1',
        senderName: 'James',
        content: 'Perfect! I will implement this now. Do you have error handling examples?',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'msg-5',
        senderId: 'sarah-1',
        senderName: 'Sarah',
        content: 'Yes, the API returns standard HTTP status codes. 400 for validation errors, 402 for payment failures, 500 for server errors. Each error response includes a detailed message.',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ]
  },
  {
    id: 'conv-2',
    projectId: 'proj-1',
    participants: ['mike-1', 'james-1', 'sarah-1'],
    topic: 'Sprint Planning & Timeline Review',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    messages: [
      {
        id: 'msg-6',
        senderId: 'mike-1',
        senderName: 'Mike',
        content: 'Team, I have reviewed our current progress. We are 75% complete on the e-commerce platform. Let us discuss the remaining tasks.',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: 'msg-7',
        senderId: 'james-1',
        senderName: 'James',
        content: 'I am finishing the checkout flow today. After that, I can work on mobile responsiveness improvements.',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString()
      },
      {
        id: 'msg-8',
        senderId: 'sarah-1',
        senderName: 'Sarah',
        content: 'The API optimization is complete. I can help with testing once James finishes the frontend.',
        type: 'text',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      }
    ]
  }
];

export function AgentConversationPanel() {
  const [selectedConversation, setSelectedConversation] = useState<AgentConversation | null>(
    mockConversations[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredConversations = mockConversations.filter(conv =>
    conv.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="h-full flex">
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={clsx(
                'p-4 border-b border-gray-100 cursor-pointer transition-colors',
                selectedConversation?.id === conversation.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              )}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.topic}
                    </h4>
                    <div className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      conversation.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {conversation.status}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conversation.messages[conversation.messages.length - 1]?.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {conversation.participants.length} participants
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Conversation Detail */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedConversation.topic}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">
                  {selectedConversation.participants.length} participants
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">
                  Started {formatDistanceToNow(new Date(selectedConversation.createdAt), { addSuffix: true })}
                </span>
                <span className="text-gray-300">•</span>
                <div className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  selectedConversation.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {selectedConversation.status}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              <AnimatePresence>
                {selectedConversation.messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {message.senderName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {message.senderName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.timestamp), 'h:mm a')}
                        </span>
                      </div>
                      
                      <div className={clsx(
                        'mt-1 p-3 rounded-lg',
                        message.type === 'code'
                          ? 'bg-gray-900 text-gray-100 font-mono text-sm'
                          : 'bg-white border border-gray-200'
                      )}>
                        {message.type === 'code' ? (
                          <pre className="whitespace-pre-wrap">{message.content}</pre>
                        ) : (
                          <p className="text-sm text-gray-900">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a conversation from the list to view details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}