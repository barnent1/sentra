'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { User, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

// MD5 for Gravatar
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }
  function addUnsigned(x: number, y: number): number {
    const x8 = x & 0x80000000, y8 = y & 0x80000000;
    const x4 = x & 0x40000000, y4 = y & 0x40000000;
    const result = (x & 0x3fffffff) + (y & 0x3fffffff);
    if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
    if (x4 | y4) return result & 0x40000000 ? result ^ 0xc0000000 ^ x8 ^ y8 : result ^ 0x40000000 ^ x8 ^ y8;
    return result ^ x8 ^ y8;
  }
  function f(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number) { return x ^ y ^ z; }
  function i(x: number, y: number, z: number) { return y ^ (x | ~z); }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac)), s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac)), s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac)), s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    return addUnsigned(rotateLeft(addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac)), s), b);
  }
  function convertToWordArray(str: string): number[] {
    const wordCount = ((str.length + 8) >> 6) + 1;
    const wordArray = new Array(wordCount * 16).fill(0);
    let bytePos = 0, byteCount = 0;
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
    for (let j = 0; j <= 3; j++) hex += ('0' + ((value >> (j * 8)) & 255).toString(16)).slice(-2);
    return hex;
  }
  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const S = [[7,12,17,22],[5,9,14,20],[4,11,16,23],[6,10,15,21]];
  const K = [0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391];
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a=ff(a,b,c,d,x[k+0],S[0][0],K[0]);d=ff(d,a,b,c,x[k+1],S[0][1],K[1]);c=ff(c,d,a,b,x[k+2],S[0][2],K[2]);b=ff(b,c,d,a,x[k+3],S[0][3],K[3]);
    a=ff(a,b,c,d,x[k+4],S[0][0],K[4]);d=ff(d,a,b,c,x[k+5],S[0][1],K[5]);c=ff(c,d,a,b,x[k+6],S[0][2],K[6]);b=ff(b,c,d,a,x[k+7],S[0][3],K[7]);
    a=ff(a,b,c,d,x[k+8],S[0][0],K[8]);d=ff(d,a,b,c,x[k+9],S[0][1],K[9]);c=ff(c,d,a,b,x[k+10],S[0][2],K[10]);b=ff(b,c,d,a,x[k+11],S[0][3],K[11]);
    a=ff(a,b,c,d,x[k+12],S[0][0],K[12]);d=ff(d,a,b,c,x[k+13],S[0][1],K[13]);c=ff(c,d,a,b,x[k+14],S[0][2],K[14]);b=ff(b,c,d,a,x[k+15],S[0][3],K[15]);
    a=gg(a,b,c,d,x[k+1],S[1][0],K[16]);d=gg(d,a,b,c,x[k+6],S[1][1],K[17]);c=gg(c,d,a,b,x[k+11],S[1][2],K[18]);b=gg(b,c,d,a,x[k+0],S[1][3],K[19]);
    a=gg(a,b,c,d,x[k+5],S[1][0],K[20]);d=gg(d,a,b,c,x[k+10],S[1][1],K[21]);c=gg(c,d,a,b,x[k+15],S[1][2],K[22]);b=gg(b,c,d,a,x[k+4],S[1][3],K[23]);
    a=gg(a,b,c,d,x[k+9],S[1][0],K[24]);d=gg(d,a,b,c,x[k+14],S[1][1],K[25]);c=gg(c,d,a,b,x[k+3],S[1][2],K[26]);b=gg(b,c,d,a,x[k+8],S[1][3],K[27]);
    a=gg(a,b,c,d,x[k+13],S[1][0],K[28]);d=gg(d,a,b,c,x[k+2],S[1][1],K[29]);c=gg(c,d,a,b,x[k+7],S[1][2],K[30]);b=gg(b,c,d,a,x[k+12],S[1][3],K[31]);
    a=hh(a,b,c,d,x[k+5],S[2][0],K[32]);d=hh(d,a,b,c,x[k+8],S[2][1],K[33]);c=hh(c,d,a,b,x[k+11],S[2][2],K[34]);b=hh(b,c,d,a,x[k+14],S[2][3],K[35]);
    a=hh(a,b,c,d,x[k+1],S[2][0],K[36]);d=hh(d,a,b,c,x[k+4],S[2][1],K[37]);c=hh(c,d,a,b,x[k+7],S[2][2],K[38]);b=hh(b,c,d,a,x[k+10],S[2][3],K[39]);
    a=hh(a,b,c,d,x[k+13],S[2][0],K[40]);d=hh(d,a,b,c,x[k+0],S[2][1],K[41]);c=hh(c,d,a,b,x[k+3],S[2][2],K[42]);b=hh(b,c,d,a,x[k+6],S[2][3],K[43]);
    a=hh(a,b,c,d,x[k+9],S[2][0],K[44]);d=hh(d,a,b,c,x[k+12],S[2][1],K[45]);c=hh(c,d,a,b,x[k+15],S[2][2],K[46]);b=hh(b,c,d,a,x[k+2],S[2][3],K[47]);
    a=ii(a,b,c,d,x[k+0],S[3][0],K[48]);d=ii(d,a,b,c,x[k+7],S[3][1],K[49]);c=ii(c,d,a,b,x[k+14],S[3][2],K[50]);b=ii(b,c,d,a,x[k+5],S[3][3],K[51]);
    a=ii(a,b,c,d,x[k+12],S[3][0],K[52]);d=ii(d,a,b,c,x[k+3],S[3][1],K[53]);c=ii(c,d,a,b,x[k+10],S[3][2],K[54]);b=ii(b,c,d,a,x[k+1],S[3][3],K[55]);
    a=ii(a,b,c,d,x[k+8],S[3][0],K[56]);d=ii(d,a,b,c,x[k+15],S[3][1],K[57]);c=ii(c,d,a,b,x[k+6],S[3][2],K[58]);b=ii(b,c,d,a,x[k+13],S[3][3],K[59]);
    a=ii(a,b,c,d,x[k+4],S[3][0],K[60]);d=ii(d,a,b,c,x[k+11],S[3][1],K[61]);c=ii(c,d,a,b,x[k+2],S[3][2],K[62]);b=ii(b,c,d,a,x[k+9],S[3][3],K[63]);
    a=addUnsigned(a,AA);b=addUnsigned(b,BB);c=addUnsigned(c,CC);d=addUnsigned(d,DD);
  }
  return wordToHex(a)+wordToHex(b)+wordToHex(c)+wordToHex(d);
}

function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

type ToastType = 'success' | 'error';
interface Toast { type: ToastType; message: string; }

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;

    try {
      setSaving(true);
      setToast(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setToast({ type: 'success', message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="border-b border-[#27272A] bg-[#18181B]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500/10 border border-green-500/50'
                : 'bg-red-500/10 border border-red-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={toast.type === 'success' ? 'text-green-300' : 'text-red-300'}>
              {toast.message}
            </span>
          </div>
        )}

        <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#27272A]">
            <img
              src={getGravatarUrl(user.email, 200)}
              alt={user.name || user.email}
              className="w-24 h-24 rounded-full border-4 border-[#3F3F46]"
            />
            <div>
              <h2 className="text-xl font-semibold text-white">{user.name || 'User'}</h2>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-600 mt-2">
                Avatar powered by{' '}
                <a
                  href="https://gravatar.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300"
                >
                  Gravatar
                </a>
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#27272A] border border-[#3F3F46] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be displayed across Quetrex
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-[#1F1F23] border border-[#27272A] rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-[#27272A]">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Account Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Account ID</span>
                  <p className="text-white font-mono text-xs">{user.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email verified</span>
                  <p className="text-green-400">Yes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-[#27272A]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg transition text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
