'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Avatar } from '@/components/Avatar';
import { ArrowLeft, Mail, User, Calendar, X } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return null;

  // Format join date
  const joinDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0A0A0B] p-8">
        {/* Header with Back and Close Buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#27272A] transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar email={user.email} name={user.name} size="lg" />

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.name || 'User Profile'}
                </h1>
                <p className="text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>

              {/* Edit Button (placeholder) */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <User className="w-4 h-4" />
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={user.name || ''}
                    className="w-full px-4 py-2 bg-[#27272A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-white">{user.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-white">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* User ID */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">User ID</label>
                <p className="text-gray-500 font-mono text-sm">{user.id}</p>
              </div>
            </div>

            {/* Save Button (when editing) */}
            {isEditing && (
              <div className="mt-8 pt-6 border-t border-[#27272A]">
                <button
                  onClick={() => {
                    // TODO: Implement profile update
                    setIsEditing(false);
                  }}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Profile editing will be available soon
                </p>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-8 mt-6">
            <h2 className="text-xl font-semibold text-white mb-6">Account Actions</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0A0A0B] rounded-lg">
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-sm text-gray-400">Update your account password</p>
                </div>
                <button className="px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg transition-colors">
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0A0A0B] rounded-lg border border-red-900/20">
                <div>
                  <p className="text-red-400 font-medium">Delete Account</p>
                  <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              These features will be available soon
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
