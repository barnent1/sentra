'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      // Redirect to runner setup wizard after signup
      router.push('/setup/runner');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Free badge */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
            Free - No credit card required
          </span>
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Get Started with Quetrex</h1>
            <p className="text-gray-400 mt-2">AI-powered development in 2 minutes</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-300 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#27272A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#27272A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-[#27272A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition text-lg"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-violet-400 hover:text-violet-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* What's next preview */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Next: Set up your AI runner (2 min)</p>
        </div>
      </div>
    </div>
  );
}
