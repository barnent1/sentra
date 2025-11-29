/**
 * DELETE /api/runners/[id] - Delete a runner
 * GET /api/runners/[id] - Get a single runner by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { drizzleDb } from '@/services/database-drizzle';
import { deprovisionRunner } from '@/services/runner-provisioning';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const runner = await drizzleDb.getRunnerById(id);

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    // Verify ownership
    if (runner.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      id: runner.id,
      name: runner.name,
      provider: runner.provider,
      region: runner.region,
      serverType: runner.serverType,
      maxConcurrentJobs: runner.maxConcurrentJobs,
      status: runner.status,
      ipAddress: runner.ipAddress,
      lastHeartbeat: runner.lastHeartbeat,
      cpuUsage: runner.cpuUsage,
      memoryUsage: runner.memoryUsage,
      createdAt: runner.createdAt,
    });
  } catch (error) {
    console.error('[Runners] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to get runner' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const runner = await drizzleDb.getRunnerById(id);

    if (!runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 });
    }

    // Verify ownership
    if (runner.userId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If the runner has an IP address and API token, deprovision from Hetzner
    if (runner.ipAddress && runner.apiToken) {
      try {
        const deprovisionResult = await deprovisionRunner(runner.apiToken, runner.ipAddress);
        if (!deprovisionResult.success) {
          console.warn('[Runners] Failed to deprovision from Hetzner:', deprovisionResult.error);
          // Continue with database deletion even if Hetzner deletion fails
        }
      } catch (deprovisionError) {
        console.warn('[Runners] Error during deprovisioning:', deprovisionError);
        // Continue with database deletion
      }
    }

    // Delete from database
    const deleted = await drizzleDb.deleteRunner(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete runner from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Runner deleted successfully' });
  } catch (error) {
    console.error('[Runners] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete runner' },
      { status: 500 }
    );
  }
}
