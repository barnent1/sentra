/**
 * POST /api/auth/token - Generate API token for CLI authentication
 *
 * This endpoint allows users to get a long-lived token for CLI use.
 * Users authenticate with email/password and receive a token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';
import { drizzleDb } from '@/services/database-drizzle';

export const runtime = 'nodejs';

interface TokenRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TokenRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await drizzleDb.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate long-lived token (30 days for CLI use)
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('[Auth] JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      type: 'cli', // Mark as CLI token
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({
      token,
      expiresIn: '30 days',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[Auth] Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
