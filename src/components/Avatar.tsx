'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import md5 from 'md5';

interface AvatarProps {
  email: string;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Generate Gravatar URL from email
 * https://docs.gravatar.com/api/avatars/images/
 */
function getGravatarUrl(email: string, size: number = 80): string {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = md5(trimmedEmail);
  // Gravatar URL - will show user's gravatar if exists, otherwise fallback to identicon
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Get initials from name or email
 */
function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  if (email) {
    return email.substring(0, 2).toUpperCase();
  }

  return 'U';
}

const sizeClasses = {
  sm: 'w-8 h-8 min-w-8 min-h-8 text-xs',
  md: 'w-10 h-10 min-w-10 min-h-10 text-sm',
  lg: 'w-16 h-16 min-w-16 min-h-16 text-lg',
};

const sizePx = {
  sm: 32,
  md: 40,
  lg: 64,
};

export function Avatar({ email, name, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const gravatarUrl = getGravatarUrl(email, sizePx[size] * 2); // 2x for retina
  const initials = getInitials(name, email);

  useEffect(() => {
    // Reset states when email changes
    setImageError(false);
    setImageLoaded(false);

    // Check if image is already cached - if so, it will load instantly
    const img = new window.Image();
    img.src = gravatarUrl;
    if (img.complete) {
      setImageLoaded(true);
    }
  }, [email, gravatarUrl]);

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Always render image to allow browser caching to work */}
      <Image
        src={gravatarUrl}
        alt={name || email}
        width={sizePx[size]}
        height={sizePx[size]}
        className={`rounded-full object-cover border-2 border-[#3F3F46] transition-opacity duration-150 ${
          imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(false);
        }}
      />

      {/* Fallback to initials if image fails to load or hasn't loaded yet */}
      {(imageError || !imageLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-violet-600 text-white rounded-full font-semibold border-2 border-[#3F3F46]">
          {initials}
        </div>
      )}
    </div>
  );
}
