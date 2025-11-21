import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET environment variable is not set');
}

interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Public API routes that don't require authentication
 */
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/realtime-token',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// This middleware runs on Vercel Edge Runtime
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all dashboard routes
    '/dashboard/:path*',
    // Match menubar
    '/menubar/:path*',
  ],
};

export function middleware(request: NextRequest) {
  // Add security headers
  const headers = new Headers();
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    // Check if this is a public API path
    if (!isPublicPath(request.nextUrl.pathname)) {
      // Authenticate API routes
      if (!JWT_SECRET) {
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        );
      }

      // Get token from Authorization header
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      // Also check query parameter for SSE endpoints (EventSource limitation)
      const queryToken = request.nextUrl.searchParams.get('token');
      const finalToken = token || queryToken;

      if (!finalToken) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );
      }

      try {
        // Verify token
        const decoded = jwt.verify(finalToken, JWT_SECRET) as JWTPayload;

        // Add user info to request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', decoded.userId);
        requestHeaders.set('x-user-email', decoded.email);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return NextResponse.json(
            { error: 'Token expired' },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
  }

  // For non-API routes or public API routes, just add security headers
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

// Note: Middleware runs on Edge Runtime by default in Next.js
// No need to explicitly set runtime = 'edge' here
