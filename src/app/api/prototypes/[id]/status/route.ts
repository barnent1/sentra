/**
 * GET /api/prototypes/[id]/status
 *
 * Get deployment status for a prototype
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

interface DeploymentStatusResponse {
  prototypeId: string;
  deploymentUrl: string;
  status: 'pending' | 'deploying' | 'ready' | 'error';
  version: number;
}

/**
 * GET /api/prototypes/[id]/status
 *
 * Get deployment status for a prototype
 *
 * @param request - Next.js request
 * @param params - Route parameters with prototype ID
 * @returns Deployment status information
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

    // Return deployment status
    const response: DeploymentStatusResponse = {
      prototypeId: prototype.id,
      deploymentUrl: prototype.deploymentUrl,
      status: prototype.deploymentStatus,
      version: prototype.version,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Status error:', error);

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}
