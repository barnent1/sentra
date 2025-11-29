/**
 * POST /api/runners - Create a new runner
 * GET /api/runners - List runners for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { drizzleDb } from '@/services/database-drizzle';
import { validateHetznerToken, provisionRunner, ServerType } from '@/services/runner-provisioning';
import { randomBytes } from 'crypto';

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

    // Validate Hetzner API token if provided
    if (provider === 'hetzner' && apiToken) {
      const isValidToken = await validateHetznerToken(apiToken);
      if (!isValidToken) {
        return NextResponse.json(
          { error: 'Invalid Hetzner API token. Please check your token and try again.' },
          { status: 400 }
        );
      }
    }

    // Get user's organizations to find their personal org
    const userOrgs = await drizzleDb.listUserOrganizations(user.userId);
    const personalOrg = userOrgs.find(org => org.type === 'personal') || userOrgs[0];

    // Generate a unique API key for this runner to communicate with Quetrex
    const runnerApiKey = `qr_${randomBytes(32).toString('hex')}`;

    // Create the runner
    const runner = await drizzleDb.createRunner({
      userId: user.userId,
      orgId: personalOrg?.id,
      name,
      provider,
      region,
      serverType,
      maxConcurrentJobs: concurrentJobs,
      apiToken, // Note: In production, encrypt this before storing
    });

    // If Hetzner and API token provided, start provisioning in background
    if (provider === 'hetzner' && apiToken) {
      // Fire and forget - provisioning runs in background
      // The provisionRunner function updates the runner status as it progresses
      provisionRunner({
        userId: user.userId,
        runnerId: runner.id,
        apiToken,
        serverType: serverType as ServerType,
        region,
        maxConcurrentJobs: concurrentJobs,
        quetrexApiKey: runnerApiKey,
      }).catch((error) => {
        console.error('[Runners] Background provisioning error:', error);
      });

      // Return immediately with provisioning status
      return NextResponse.json({
        id: runner.id,
        name: runner.name,
        provider: runner.provider,
        region: runner.region,
        serverType: runner.serverType,
        maxConcurrentJobs: runner.maxConcurrentJobs,
        status: 'provisioning',
        message: 'Runner is being provisioned. This typically takes 2-3 minutes.',
        createdAt: runner.createdAt,
      }, { status: 201 });
    }

    // For non-Hetzner or no API token, just create the record
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
