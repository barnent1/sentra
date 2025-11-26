/**
 * POST /api/prototypes/[id]/iterate
 *
 * Iterate on existing prototype with user feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';
import { V0IntegrationService } from '@/services/v0-integration';
import { PrototypeDeploymentService } from '@/services/prototype-deployment';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

interface IteratePrototypeRequest {
  feedback: string;
}

interface IteratePrototypeResponse {
  prototypeId: string;
  version: number;
  deploymentUrl: string;
  deploymentId: string;
  status: 'pending' | 'deploying' | 'ready' | 'error';
}

/**
 * POST /api/prototypes/[id]/iterate
 *
 * Iterate on prototype with user feedback
 *
 * @param request - Next.js request with feedback
 * @param params - Route parameters with prototype ID
 * @returns Updated prototype with new version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = requireAuthUser(request);

    const { id } = params;

    // Parse request body
    const body = (await request.json()) as IteratePrototypeRequest;
    const { feedback } = body;

    // Validate required fields
    if (!feedback) {
      return NextResponse.json(
        { error: 'feedback is required' },
        { status: 400 }
      );
    }

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

    // Initialize v0 service
    const v0ApiKey = process.env.V0_API_KEY;
    if (!v0ApiKey) {
      return NextResponse.json(
        { error: 'v0 API key not configured' },
        { status: 500 }
      );
    }

    const v0Service = new V0IntegrationService(v0ApiKey);

    // Iterate via v0 API
    const v0Response = await v0Service.iterate(prototype.v0ChatId, feedback);

    // Increment version
    const newVersion = prototype.version + 1;

    // Redeploy with updated files
    const deploymentService = new PrototypeDeploymentService();
    const deployment = await deploymentService.deploy({
      projectName: project.name,
      prototypeId: prototype.id,
      files: v0Response.files,
    });

    // Update prototype with new files, version, and deployment info
    const updatedPrototype = await (drizzleDb as any).updatePrototype(id, {
      files: v0Response.files,
      version: newVersion,
      deploymentStatus: deployment.status,
    });

    // Create iteration record
    await (drizzleDb as any).createPrototypeIteration({
      prototypeId: id,
      feedback,
      changesApplied: 'Design updated based on feedback',
    });

    // Return response
    const response: IteratePrototypeResponse = {
      prototypeId: updatedPrototype.id,
      version: updatedPrototype.version,
      deploymentUrl: deployment.url,
      deploymentId: deployment.deploymentId,
      status: updatedPrototype.deploymentStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Iterate error:', error);

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to iterate on prototype' },
      { status: 500 }
    );
  }
}
