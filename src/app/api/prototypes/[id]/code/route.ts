/**
 * GET /api/prototypes/[id]/code
 *
 * Export code files from prototype for implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';
import type { CodeFile } from '@/db/schema';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

interface CodeExportResponse {
  files: CodeFile[];
}

/**
 * GET /api/prototypes/[id]/code
 *
 * Export code files from prototype
 *
 * @param request - Next.js request
 * @param params - Route parameters with prototype ID
 * @returns Array of code files with path and content
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

    // Return code files
    const response: CodeExportResponse = {
      files: prototype.files || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Get code error:', error);

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
