/**
 * POST /api/runners - Create a new runner
 * GET /api/runners - List runners for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { drizzleDb } from '@/services/database-drizzle';

export const runtime = 'nodejs';

interface CreateRunnerRequest {
  provider: 'hetzner' | 'aws' | 'gcp' | 'azure' | 'other';
  name: string;
  region: string;
  serverType: string;
  maxConcurrentJobs?: number;
  apiToken?: string;
}

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

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as CreateRunnerRequest;
    const { provider, name, region, serverType, maxConcurrentJobs, apiToken } = body;

    if (!provider || !name || !region || !serverType) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, name, region, serverType' },
        { status: 400 }
      );
    }

    // Validate maxConcurrentJobs (default to 1 if not provided)
    const concurrentJobs = maxConcurrentJobs ?? 1;
    if (concurrentJobs < 1 || concurrentJobs > 8) {
      return NextResponse.json(
        { error: 'maxConcurrentJobs must be between 1 and 8' },
        { status: 400 }
      );
    }

    // Get user's organizations to find their personal org
    const userOrgs = await drizzleDb.listUserOrganizations(user.userId);
    const personalOrg = userOrgs.find(org => org.type === 'personal') || userOrgs[0];

    // Create the runner
    const runner = await drizzleDb.createRunner({
      userId: user.userId,
      orgId: personalOrg?.id,
      name,
      provider,
      region,
      serverType,
      maxConcurrentJobs: concurrentJobs,
      apiToken,
    });

    // TODO: In a real implementation, we would:
    // 1. Encrypt the API token before storing
    // 2. Trigger a background job to provision the server
    // 3. Set up the runner agent on the server
    // 4. Update the runner status to 'provisioning' then 'active'

    // For now, simulate provisioning
    await drizzleDb.updateRunner(runner.id, { status: 'provisioning' });

    return NextResponse.json({
      id: runner.id,
      name: runner.name,
      provider: runner.provider,
      region: runner.region,
      serverType: runner.serverType,
      maxConcurrentJobs: runner.maxConcurrentJobs,
      status: runner.status,
      createdAt: runner.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('[Runners] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create runner' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRunners = await drizzleDb.listRunnersByUser(user.userId);

    return NextResponse.json({
      runners: userRunners.map(runner => ({
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
      })),
    });
  } catch (error) {
    console.error('[Runners] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list runners' },
      { status: 500 }
    );
  }
}
