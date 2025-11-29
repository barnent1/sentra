'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type Provider = 'hetzner' | 'existing';
type Step = 'provider' | 'capacity' | 'credentials' | 'complete';

interface CapacityTier {
  id: string;
  name: string;
  serverType: string;
  concurrentJobs: number;
  ram: string;
  monthlyCost: string;
  description: string;
  popular?: boolean;
}

const CAPACITY_TIERS: CapacityTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    serverType: 'cx22',
    concurrentJobs: 1,
    ram: '4GB',
    monthlyCost: '~$4',
    description: 'Best for solo developers working on one project at a time',
  },
  {
    id: 'standard',
    name: 'Standard',
    serverType: 'cx32',
    concurrentJobs: 2,
    ram: '8GB',
    monthlyCost: '~$9',
    description: 'Good balance for multiple projects with light parallelism',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    serverType: 'cx42',
    concurrentJobs: 4,
    ram: '16GB',
    monthlyCost: '~$18',
    description: 'For agencies or teams with several active projects',
  },
  {
    id: 'power',
    name: 'Power',
    serverType: 'cx52',
    concurrentJobs: 8,
    ram: '32GB',
    monthlyCost: '~$35',
    description: 'Maximum capacity for heavy usage and large teams',
  },
];

export default function RunnerSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('provider');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<CapacityTier>(CAPACITY_TIERS[1]); // Default to Standard
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProviderSelect = (p: Provider) => {
    setProvider(p);
    setStep('capacity');
  };

  const handleCapacitySelect = (tier: CapacityTier) => {
    setSelectedCapacity(tier);
  };

  const handleCapacityContinue = () => {
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Please log in to continue');
      }

      const response = await fetch('/api/runners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          provider: provider === 'existing' ? 'hetzner' : provider,
          apiToken,
          name: `${user?.name || 'My'}'s Runner`,
          region: 'ash', // Ashburn, closest to us-east-1
          serverType: selectedCapacity.serverType,
          maxConcurrentJobs: selectedCapacity.concurrentJobs,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create runner');
      }

      setStep('complete');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to setup runner';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  // Provider selection step
  if (step === 'provider') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-400 text-sm rounded-full border border-violet-500/30 mb-4">
              Step 1 of 3
            </div>
            <h1 className="text-3xl font-bold text-white">Set Up Your AI Runner</h1>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">
              A runner executes AI agents on your behalf. We recommend Hetzner for best price/performance.
            </p>
          </div>

          <div className="grid gap-4">
            {/* New Hetzner Account */}
            <button
              onClick={() => handleProviderSelect('hetzner')}
              className="bg-[#18181B] border border-[#27272A] hover:border-violet-500 rounded-lg p-6 text-left transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#D9232E]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#D9232E]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition">
                    Create New Hetzner Account
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    We&apos;ll help you set up a Hetzner Cloud account. CX32 costs ~$8/mo.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Recommended</span>
                    <span className="text-gray-500 text-xs">Best price/performance</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Existing Hetzner Account */}
            <button
              onClick={() => handleProviderSelect('existing')}
              className="bg-[#18181B] border border-[#27272A] hover:border-violet-500 rounded-lg p-6 text-left transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition">
                    I Already Have a Hetzner Account
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Connect your existing Hetzner Cloud account with an API token.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-8">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-400 text-sm"
            >
              Skip for now - I&apos;ll set this up later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Capacity selection step
  if (step === 'capacity') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setStep('provider')}
            className="text-gray-500 hover:text-gray-400 mb-6 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-400 text-sm rounded-full border border-violet-500/30 mb-4">
              Step 2 of 3
            </div>
            <h1 className="text-2xl font-bold text-white">Choose Your Runner Capacity</h1>
            <p className="text-gray-400 mt-2 max-w-lg mx-auto">
              How many AI jobs do you want to run at once? You can change this later.
            </p>
          </div>

          <div className="grid gap-3">
            {CAPACITY_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => handleCapacitySelect(tier)}
                className={`bg-[#18181B] border rounded-lg p-4 text-left transition group ${
                  selectedCapacity.id === tier.id
                    ? 'border-violet-500 ring-1 ring-violet-500'
                    : 'border-[#27272A] hover:border-violet-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCapacity.id === tier.id
                        ? 'border-violet-500 bg-violet-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedCapacity.id === tier.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{tier.concurrentJobs} job{tier.concurrentJobs > 1 ? 's' : ''} at a time</span>
                        {tier.popular && (
                          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-0.5">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{tier.monthlyCost}/mo</div>
                    <div className="text-gray-500 text-xs">{tier.ram} RAM</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info box about how jobs work */}
          <div className="mt-6 p-4 bg-[#18181B] border border-[#27272A] rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="text-gray-300">Jobs queue across ALL your projects.</p>
                <p className="text-gray-500 mt-1">
                  If you have 3 projects and choose &quot;2 at a time&quot;, two issues will process simultaneously while others wait in queue.
                </p>
              </div>
            </div>
          </div>

          {provider === 'hetzner' && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-green-400 font-medium">New to Hetzner? Get free credit!</p>
                  <p className="text-gray-400 mt-1">
                    Sign up through our link and get €20 free credit - that&apos;s {selectedCapacity.id === 'starter' ? '~5 months' : selectedCapacity.id === 'standard' ? '~2 months' : '~1 month'} of free hosting!
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCapacityContinue}
            className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-medium transition"
          >
            Continue with {selectedCapacity.name} ({selectedCapacity.monthlyCost}/mo)
          </button>
        </div>
      </div>
    );
  }

  // Credentials step
  if (step === 'credentials') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button
            onClick={() => setStep('capacity')}
            className="text-gray-500 hover:text-gray-400 mb-6 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-400 text-sm rounded-full border border-violet-500/30 mb-4">
              Step 3 of 3
            </div>
            <h1 className="text-2xl font-bold text-white">Connect Hetzner</h1>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            {provider === 'hetzner' && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-400 font-medium mb-2">First time? Follow these steps:</h3>
                <ol className="text-sm text-gray-400 space-y-2">
                  <li>1. Go to <a href="https://console.hetzner.cloud" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">console.hetzner.cloud</a></li>
                  <li>2. Create an account (requires credit card)</li>
                  <li>3. Create a new project</li>
                  <li>4. Go to Security → API Tokens → Generate API Token</li>
                  <li>5. Select &quot;Read & Write&quot; permissions</li>
                  <li>6. Copy the token and paste below</li>
                </ol>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiToken" className="block text-sm text-gray-300 mb-2">
                  Hetzner API Token
                </label>
                <input
                  id="apiToken"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#27272A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-sm"
                  placeholder="Paste your Hetzner API token here"
                />
                <p className="text-gray-500 text-xs mt-2">
                  Your token is encrypted and stored securely.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !apiToken}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition"
              >
                {loading ? 'Setting up runner...' : 'Create Runner'}
              </button>
            </form>

            {/* Selected capacity summary */}
            <div className="mt-4 p-3 bg-[#0A0A0B] rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Selected capacity:</span>
                <span className="text-white">{selectedCapacity.concurrentJobs} concurrent job{selectedCapacity.concurrentJobs > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Server:</span>
                <span className="text-white">{selectedCapacity.serverType.toUpperCase()} ({selectedCapacity.ram})</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Estimated cost:</span>
                <span className="text-white">{selectedCapacity.monthlyCost}/month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete step
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Runner Created!</h1>
        <p className="text-gray-400 mb-6">
          Your AI runner is being provisioned. It will be ready in about 2-3 minutes.
        </p>

        {/* Runner summary */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-4 mb-6 text-left">
          <h3 className="text-white font-medium mb-3">Runner Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Capacity:</span>
              <span className="text-white">{selectedCapacity.concurrentJobs} concurrent job{selectedCapacity.concurrentJobs > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Server:</span>
              <span className="text-white">{selectedCapacity.serverType.toUpperCase()} ({selectedCapacity.ram} RAM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Region:</span>
              <span className="text-white">Ashburn, VA (US East)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly cost:</span>
              <span className="text-white">{selectedCapacity.monthlyCost} (billed by Hetzner)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 text-left mb-6">
          <h3 className="text-white font-medium mb-4">Next: Add your first project</h3>
          <div className="bg-[#0A0A0B] rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-500 mb-1"># In your project directory, run:</p>
            <p className="text-violet-400">quetrex init</p>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            This connects your project to Quetrex and enables AI-powered workflows.
          </p>
        </div>

        <button
          onClick={handleContinue}
          className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg font-medium transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
