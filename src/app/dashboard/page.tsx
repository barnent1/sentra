'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';
import { DeleteRunnerModal } from '@/components/DeleteRunnerModal';

interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  settings?: {
    lastActivity?: string;
  };
}

interface Runner {
  id: string;
  name: string;
  status: string;
  provider: string;
  region: string;
  ipAddress?: string;
}

// MD5 implementation for Gravatar (browser-compatible)
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const x8 = x & 0x80000000;
    const y8 = y & 0x80000000;
    const x4 = x & 0x40000000;
    const y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) {
      if (result & 0x40000000) return result ^ 0xc0000000 ^ x8 ^ y8;
      return result ^ 0x40000000 ^ x8 ^ y8;
    }
    return result ^ x8 ^ y8;
  }

  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const wordCount = ((str.length + 8) >> 6) + 1;
    const wordArray = new Array(wordCount * 16).fill(0);
    let bytePos = 0;
    let byteCount = 0;
    while (byteCount < str.length) {
      const wordPos = (byteCount - (byteCount % 4)) / 4;
      bytePos = (byteCount % 4) * 8;
      wordArray[wordPos] = wordArray[wordPos] | (str.charCodeAt(byteCount) << bytePos);
      byteCount++;
    }
    const wordPos = (byteCount - (byteCount % 4)) / 4;
    bytePos = (byteCount % 4) * 8;
    wordArray[wordPos] = wordArray[wordPos] | (0x80 << bytePos);
    wordArray[wordCount * 16 - 2] = str.length * 8;
    return wordArray;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const S = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    // Round 1
    a = ff(a, b, c, d, x[k + 0], S[0][0], K[0]); d = ff(d, a, b, c, x[k + 1], S[0][1], K[1]);
    c = ff(c, d, a, b, x[k + 2], S[0][2], K[2]); b = ff(b, c, d, a, x[k + 3], S[0][3], K[3]);
    a = ff(a, b, c, d, x[k + 4], S[0][0], K[4]); d = ff(d, a, b, c, x[k + 5], S[0][1], K[5]);
    c = ff(c, d, a, b, x[k + 6], S[0][2], K[6]); b = ff(b, c, d, a, x[k + 7], S[0][3], K[7]);
    a = ff(a, b, c, d, x[k + 8], S[0][0], K[8]); d = ff(d, a, b, c, x[k + 9], S[0][1], K[9]);
    c = ff(c, d, a, b, x[k + 10], S[0][2], K[10]); b = ff(b, c, d, a, x[k + 11], S[0][3], K[11]);
    a = ff(a, b, c, d, x[k + 12], S[0][0], K[12]); d = ff(d, a, b, c, x[k + 13], S[0][1], K[13]);
    c = ff(c, d, a, b, x[k + 14], S[0][2], K[14]); b = ff(b, c, d, a, x[k + 15], S[0][3], K[15]);
    // Round 2
    a = gg(a, b, c, d, x[k + 1], S[1][0], K[16]); d = gg(d, a, b, c, x[k + 6], S[1][1], K[17]);
    c = gg(c, d, a, b, x[k + 11], S[1][2], K[18]); b = gg(b, c, d, a, x[k + 0], S[1][3], K[19]);
    a = gg(a, b, c, d, x[k + 5], S[1][0], K[20]); d = gg(d, a, b, c, x[k + 10], S[1][1], K[21]);
    c = gg(c, d, a, b, x[k + 15], S[1][2], K[22]); b = gg(b, c, d, a, x[k + 4], S[1][3], K[23]);
    a = gg(a, b, c, d, x[k + 9], S[1][0], K[24]); d = gg(d, a, b, c, x[k + 14], S[1][1], K[25]);
    c = gg(c, d, a, b, x[k + 3], S[1][2], K[26]); b = gg(b, c, d, a, x[k + 8], S[1][3], K[27]);
    a = gg(a, b, c, d, x[k + 13], S[1][0], K[28]); d = gg(d, a, b, c, x[k + 2], S[1][1], K[29]);
    c = gg(c, d, a, b, x[k + 7], S[1][2], K[30]); b = gg(b, c, d, a, x[k + 12], S[1][3], K[31]);
    // Round 3
    a = hh(a, b, c, d, x[k + 5], S[2][0], K[32]); d = hh(d, a, b, c, x[k + 8], S[2][1], K[33]);
    c = hh(c, d, a, b, x[k + 11], S[2][2], K[34]); b = hh(b, c, d, a, x[k + 14], S[2][3], K[35]);
    a = hh(a, b, c, d, x[k + 1], S[2][0], K[36]); d = hh(d, a, b, c, x[k + 4], S[2][1], K[37]);
    c = hh(c, d, a, b, x[k + 7], S[2][2], K[38]); b = hh(b, c, d, a, x[k + 10], S[2][3], K[39]);
    a = hh(a, b, c, d, x[k + 13], S[2][0], K[40]); d = hh(d, a, b, c, x[k + 0], S[2][1], K[41]);
    c = hh(c, d, a, b, x[k + 3], S[2][2], K[42]); b = hh(b, c, d, a, x[k + 6], S[2][3], K[43]);
    a = hh(a, b, c, d, x[k + 9], S[2][0], K[44]); d = hh(d, a, b, c, x[k + 12], S[2][1], K[45]);
    c = hh(c, d, a, b, x[k + 15], S[2][2], K[46]); b = hh(b, c, d, a, x[k + 2], S[2][3], K[47]);
    // Round 4
    a = ii(a, b, c, d, x[k + 0], S[3][0], K[48]); d = ii(d, a, b, c, x[k + 7], S[3][1], K[49]);
    c = ii(c, d, a, b, x[k + 14], S[3][2], K[50]); b = ii(b, c, d, a, x[k + 5], S[3][3], K[51]);
    a = ii(a, b, c, d, x[k + 12], S[3][0], K[52]); d = ii(d, a, b, c, x[k + 3], S[3][1], K[53]);
    c = ii(c, d, a, b, x[k + 10], S[3][2], K[54]); b = ii(b, c, d, a, x[k + 1], S[3][3], K[55]);
    a = ii(a, b, c, d, x[k + 8], S[3][0], K[56]); d = ii(d, a, b, c, x[k + 15], S[3][1], K[57]);
    c = ii(c, d, a, b, x[k + 6], S[3][2], K[58]); b = ii(b, c, d, a, x[k + 13], S[3][3], K[59]);
    a = ii(a, b, c, d, x[k + 4], S[3][0], K[60]); d = ii(d, a, b, c, x[k + 11], S[3][1], K[61]);
    c = ii(c, d, a, b, x[k + 2], S[3][2], K[62]); b = ii(b, c, d, a, x[k + 9], S[3][3], K[63]);
    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

// Generate Gravatar URL with fallback to default avatar
function getGravatarUrl(email: string, size: number = 40): string {
  const hash = md5(email.toLowerCase().trim());
  // 'd=mp' means mystery person (blank head silhouette) as fallback
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [runnerToDelete, setRunnerToDelete] = useState<Runner | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Close avatar menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch projects and runners in parallel
      const [projectsRes, runnersRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/runners', { headers }),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (runnersRes.ok) {
        const runnersData = await runnersRes.json();
        setRunners(runnersData.runners || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (runner: Runner) => {
    setRunnerToDelete(runner);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRunnerToDelete(null);
  };

  const handleDeleteRunner = async (runnerId: string) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`/api/runners/${runnerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete runner');
    }

    setRunners(runners.filter(r => r.id !== runnerId));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeRunners = runners.filter(r => r.status === 'active');
  const hasSetupRunner = runners.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="border-b border-[#27272A] bg-[#18181B]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/quetrex-logo.png"
              alt="Quetrex"
              width={40}
              height={40}
            />
            <h1 className="text-xl font-bold text-white">Quetrex</h1>
          </div>
          {/* Avatar with Dropdown Menu */}
          <div className="relative" ref={avatarMenuRef}>
            <button
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              className="flex items-center gap-3 hover:opacity-80 transition"
              aria-expanded={isAvatarMenuOpen}
              aria-haspopup="true"
            >
              <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
              <img
                src={getGravatarUrl(user.email, 80)}
                alt={user.name || user.email}
                className="w-10 h-10 rounded-full border-2 border-[#3F3F46] hover:border-violet-500 transition"
              />
            </button>

            {/* Dropdown Menu */}
            {isAvatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#18181B] border border-[#27272A] rounded-lg shadow-xl z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-[#27272A]">
                  <p className="text-white font-medium truncate">{user.name || 'User'}</p>
                  <p className="text-gray-500 text-sm truncate">{user.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#27272A] hover:text-white transition"
                    onClick={() => setIsAvatarMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#27272A] hover:text-white transition"
                    onClick={() => setIsAvatarMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-[#27272A] py-1">
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-[#27272A] hover:text-red-300 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user.name || 'there'}
          </h2>
          <p className="text-gray-400 mt-1">
            Manage your AI-powered development projects
          </p>
        </div>

        {/* Runner status alert */}
        {!hasSetupRunner && (
          <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-yellow-400 font-medium">No runner configured</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Set up a runner to execute AI agents on your projects.
                </p>
                <Link
                  href="/setup/runner"
                  className="inline-block mt-3 text-sm text-violet-400 hover:text-violet-300"
                >
                  Set up runner →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-white">{projects.length}</div>
            <div className="text-gray-400 text-sm mt-1">Projects</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-white">{activeRunners.length}</div>
            <div className="text-gray-400 text-sm mt-1">Active Runners</div>
          </div>
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
            <div className="text-3xl font-bold text-violet-400">Free</div>
            <div className="text-gray-400 text-sm mt-1">Plan</div>
          </div>
        </div>

        {/* Projects section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Projects</h3>
          </div>

          {projects.length === 0 ? (
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-[#27272A] rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h4 className="text-white font-medium mb-2">No projects yet</h4>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Install the Quetrex CLI and initialize your first project.
              </p>
              <div className="bg-[#0A0A0B] rounded-lg p-4 max-w-lg mx-auto text-left space-y-4">
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 1: Install Quetrex CLI</p>
                  <code className="text-violet-400 font-mono text-sm">curl -fsSL https://quetrex.com/install.sh | bash</code>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 2: Login to your account</p>
                  <code className="text-violet-400 font-mono text-sm">quetrex login</code>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-2"># Step 3: Initialize in your project</p>
                  <code className="text-violet-400 font-mono text-sm">cd your-project && quetrex init</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-lg p-6 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-medium">{project.name}</h4>
                      <p className="text-gray-500 text-sm font-mono mt-1">{project.path}</p>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Added {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Runners section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Runners</h3>
            {hasSetupRunner && (
              <Link
                href="/setup/runner"
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                Add runner
              </Link>
            )}
          </div>

          {runners.length === 0 ? (
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 text-center">
              <p className="text-gray-400">No runners configured</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {runners.map((runner) => (
                <div
                  key={runner.id}
                  className="bg-[#18181B] border border-[#27272A] rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          runner.status === 'active'
                            ? 'bg-green-500'
                            : runner.status === 'provisioning'
                            ? 'bg-yellow-500 animate-pulse'
                            : runner.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <div>
                        <h4 className="text-white font-medium">{runner.name}</h4>
                        <p className="text-gray-500 text-sm">
                          {runner.provider} · {runner.region}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          runner.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : runner.status === 'provisioning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : runner.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {runner.status}
                      </span>
                      <button
                        onClick={() => openDeleteModal(runner)}
                        className="text-gray-500 hover:text-red-400 transition"
                        title="Delete runner"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Runner Modal */}
      <DeleteRunnerModal
        isOpen={isDeleteModalOpen}
        runner={runnerToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteRunner}
      />
    </div>
  );
}
