'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CodeBracketIcon,
  DocumentIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CodeDiff } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

// Mock code diff data
const mockCodeDiffs: CodeDiff[] = [
  {
    id: 'diff-1',
    projectId: 'proj-1',
    agentId: 'james-1',
    filepath: 'src/components/checkout/CheckoutForm.tsx',
    oldContent: `export function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (data) => {
    setLoading(true);
    // TODO: Implement payment processing
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Card Number" />
      <input type="text" placeholder="CVV" />
      <button disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}`,
    newContent: `export function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: CheckoutData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await paymentService.processPayment(data);
      if (response.success) {
        onPaymentSuccess(response.paymentId);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <input 
        type="text" 
        placeholder="Card Number" 
        required 
        pattern="[0-9]{16}"
      />
      <input 
        type="text" 
        placeholder="CVV" 
        required 
        pattern="[0-9]{3,4}"
      />
      <button disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}`,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    summary: 'Added error handling and validation to checkout form',
    linesAdded: 15,
    linesRemoved: 2,
    language: 'typescript'
  },
  {
    id: 'diff-2',
    projectId: 'proj-1',
    agentId: 'sarah-1',
    filepath: 'src/api/payments.ts',
    oldContent: `export const paymentService = {
  processPayment: async (data) => {
    // Basic implementation
    return fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};`,
    newContent: `export interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
}

export const paymentService = {
  processPayment: async (data: PaymentData): Promise<PaymentResponse> => {
    try {
      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${getAuthToken()}\`
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          metadata: {
            cardNumber: data.cardNumber.slice(-4), // Only store last 4 digits
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Payment failed'
        };
      }

      const result = await response.json();
      return {
        success: true,
        paymentId: result.id
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }
};`,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    summary: 'Enhanced payment service with proper typing and error handling',
    linesAdded: 38,
    linesRemoved: 7,
    language: 'typescript'
  },
  {
    id: 'diff-3',
    projectId: 'proj-1',
    agentId: 'james-1',
    filepath: 'src/styles/components.css',
    oldContent: `.checkout-form {
  padding: 20px;
  border: 1px solid #ccc;
}

.checkout-form input {
  margin-bottom: 10px;
  padding: 8px;
  width: 100%;
}`,
    newContent: `.checkout-form {
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: white;
}

.checkout-form input {
  margin-bottom: 16px;
  padding: 12px;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.checkout-form input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-message {
  padding: 12px;
  margin-bottom: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
}`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    summary: 'Improved checkout form styling with modern design',
    linesAdded: 17,
    linesRemoved: 8,
    language: 'css'
  }
];

export function CodeDiffPanel() {
  const [selectedDiff, setSelectedDiff] = useState<CodeDiff | null>(mockCodeDiffs[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const filteredDiffs = mockCodeDiffs.filter(diff =>
    diff.filepath.toLowerCase().includes(searchTerm.toLowerCase()) ||
    diff.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDiffContent = (diff: CodeDiff) => {
    const oldLines = diff.oldContent.split('\n');
    const newLines = diff.newContent.split('\n');

    if (viewMode === 'side-by-side') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-red-700 bg-red-50 p-2 rounded">
              Original ({oldLines.length} lines)
            </h4>
            <div className="bg-red-50 border border-red-200 rounded overflow-hidden">
              <pre className="text-sm p-4 overflow-x-auto">
                {oldLines.map((line, index) => (
                  <div key={index} className="flex">
                    <span className="text-red-400 w-8 text-right mr-3 select-none">
                      {index + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-green-700 bg-green-50 p-2 rounded">
              Updated ({newLines.length} lines)
            </h4>
            <div className="bg-green-50 border border-green-200 rounded overflow-hidden">
              <pre className="text-sm p-4 overflow-x-auto">
                {newLines.map((line, index) => (
                  <div key={index} className="flex">
                    <span className="text-green-400 w-8 text-right mr-3 select-none">
                      {index + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    // Unified view (simplified for demo)
    return (
      <div className="bg-gray-50 border border-gray-200 rounded overflow-hidden">
        <pre className="text-sm p-4 overflow-x-auto">
          {newLines.map((line, index) => (
            <div key={index} className="flex">
              <span className="text-gray-400 w-8 text-right mr-3 select-none">
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Diff List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded',
                viewMode === 'side-by-side'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded',
                viewMode === 'unified'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Unified
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredDiffs.map((diff) => (
            <motion.div
              key={diff.id}
              onClick={() => setSelectedDiff(diff)}
              className={clsx(
                'p-4 border-b border-gray-100 cursor-pointer transition-colors',
                selectedDiff?.id === diff.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              )}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CodeBracketIcon className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <DocumentIcon className="w-4 h-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {diff.filepath.split('/').pop()}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    {diff.filepath}
                  </p>
                  
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {diff.summary}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <PlusIcon className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">
                        +{diff.linesAdded}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <MinusIcon className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        -{diff.linesRemoved}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(diff.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Diff Detail */}
      <div className="flex-1 flex flex-col">
        {selectedDiff ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-2 mb-2">
                <DocumentIcon className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDiff.filepath}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {selectedDiff.summary}
              </p>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <PlusIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {selectedDiff.linesAdded} additions
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MinusIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">
                    {selectedDiff.linesRemoved} deletions
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(selectedDiff.timestamp), 'MMM dd, yyyy at h:mm a')}
                  </span>
                </div>
                
                <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {selectedDiff.language}
                </div>
              </div>
            </div>

            {/* Diff Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {renderDiffContent(selectedDiff)}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No diff selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a code change from the list to view the diff.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}