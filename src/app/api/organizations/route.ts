/**
 * GET /api/organizations - List organizations for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { drizzleDb } from '@/services/database-drizzle';

export const runtime = 'nodejs';

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userOrgs = await drizzleDb.listUserOrganizations(user.userId);

    return NextResponse.json({
      organizations: userOrgs.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        type: org.type,
        createdAt: org.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Organizations] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list organizations' },
      { status: 500 }
    );
  }
}
