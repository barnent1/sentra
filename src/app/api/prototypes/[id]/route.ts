/**
 * GET /api/prototypes/[id]
 *
 * Get prototype details including iterations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

interface PrototypeResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  deploymentUrl: string;
  deploymentStatus: string;
  version: number;
  iterations: Array<{
    id: string;
    feedback: string;
    changesApplied: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/prototypes/[id]
 *
 * Get prototype details with iterations
 *
 * @param request - Next.js request
 * @param params - Route parameters with prototype ID
 * @returns Prototype details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = requireAuthUser(request);

    const { id } = await params;

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

    // Get iterations
    const iterations = await (drizzleDb as any).getPrototypeIterations(id);

    // Build response
    const response: PrototypeResponse = {
      id: prototype.id,
      projectId: prototype.projectId,
      title: prototype.title,
      description: prototype.description,
      deploymentUrl: prototype.deploymentUrl,
      deploymentStatus: prototype.deploymentStatus,
      version: prototype.version,
      iterations: iterations.map((iteration: any) => ({
        id: iteration.id,
        feedback: iteration.feedback,
        changesApplied: iteration.changesApplied,
        createdAt: iteration.createdAt.toISOString(),
      })),
      createdAt: prototype.createdAt.toISOString(),
      updatedAt: prototype.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Get prototype error:', error);

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
