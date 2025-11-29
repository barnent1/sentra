'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Give React time to update the auth state before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Sign In to Quetrex</h1>

          {error && (
            <div
              className="bg-red-500/10 border border-red-500/50 rounded p-3 mb-4"
              role="alert"
              aria-live="polite"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                className="w-full px-4 py-2 bg-[#27272A] border border-[#3F3F46] rounded text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
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
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                className="w-full px-4 py-2 bg-[#27272A] border border-[#3F3F46] rounded text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded font-medium transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-gray-400 text-sm text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
