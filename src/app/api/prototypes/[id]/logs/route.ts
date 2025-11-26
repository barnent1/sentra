/**
 * GET /api/prototypes/[id]/logs
 *
 * Get deployment logs for a prototype
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';
import { PrototypeDeploymentService } from '@/services/prototype-deployment';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

interface DeploymentLogsResponse {
  prototypeId: string;
  logs: string[];
  status: 'pending' | 'deploying' | 'ready' | 'error';
}

/**
 * GET /api/prototypes/[id]/logs
 *
 * Get deployment logs for a prototype
 *
 * @param request - Next.js request
 * @param params - Route parameters with prototype ID
 * @returns Deployment logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = requireAuthUser(request);

    const { id } = params;

    // Get prototype
    const prototype = await (drizzleDb as any).getPrototypeById(id);

    if (!prototype) {
      return NextResponse.json(
        { error: 'Prototype not found' },
        { status: 404 }
      );
    }

    // Verify user owns the project
    const project = await drizzleDb.getProjectById(prototype.projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get deployment logs from deployment service
    // Note: In Phase 1, this returns mock logs
    // In Phase 2, this will fetch real deployment logs from Vercel API
    const deploymentService = new PrototypeDeploymentService();

    // Generate a deployment ID from prototype ID for lookup
    // In a real implementation, we'd store the deploymentId in the database
    // For now, we'll return basic logs based on deployment status
    const logs: string[] = [];

    if (prototype.deploymentStatus === 'pending') {
      logs.push(`[${new Date().toISOString()}] Deployment queued`);
    } else if (prototype.deploymentStatus === 'deploying') {
      logs.push(`[${new Date().toISOString()}] Deployment in progress`);
      logs.push(`[${new Date().toISOString()}] Building application...`);
    } else if (prototype.deploymentStatus === 'ready') {
      logs.push(`[${new Date().toISOString()}] Deployment started`);
      logs.push(`[${new Date().toISOString()}] Building application...`);
      logs.push(`[${new Date().toISOString()}] Build successful`);
      logs.push(`[${new Date().toISOString()}] Deploying to ${prototype.deploymentUrl}`);
      logs.push(`[${new Date().toISOString()}] Deployment complete`);
    } else if (prototype.deploymentStatus === 'error') {
      logs.push(`[${new Date().toISOString()}] Deployment started`);
      logs.push(`[${new Date().toISOString()}] Building application...`);
      logs.push(`[${new Date().toISOString()}] Error: Deployment failed`);
    }

    // Return deployment logs
    const response: DeploymentLogsResponse = {
      prototypeId: prototype.id,
      logs,
      status: prototype.deploymentStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Logs error:', error);

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get deployment logs' },
      { status: 500 }
    );
  }
}
