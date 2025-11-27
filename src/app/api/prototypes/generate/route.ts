/**
 * POST /api/prototypes/generate
 *
 * Generate a new prototype from architect specification
 * Integrates with v0 Platform API and stores prototype in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth-helpers';
import { drizzleDb } from '@/services/database-drizzle';
import { V0IntegrationService } from '@/services/v0-integration';
import { PrototypeDeploymentService } from '@/services/prototype-deployment';
import { buildV0Prompt, type ArchitectSpec } from '@/services/spec-to-prompt';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import yaml from 'yaml';

// Use Node.js runtime for file system access
export const runtime = 'nodejs';

interface GeneratePrototypeRequest {
  projectId: string;
  specPath: string;
  title: string;
}

interface GeneratePrototypeResponse {
  prototypeId: string;
  deploymentUrl: string;
  deploymentId: string;
  status: 'pending' | 'deploying' | 'ready' | 'error';
}

/**
 * POST /api/prototypes/generate
 *
 * Generate a new prototype from specification
 *
 * @param request - Next.js request with projectId, specPath, title
 * @returns Prototype ID, deployment URL, and status
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = requireAuthUser(request);

    // Parse request body
    const body = (await request.json()) as GeneratePrototypeRequest;
    const { projectId, specPath, title } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!specPath) {
      return NextResponse.json(
        { error: 'specPath is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Verify project exists and user owns it
    const project = await drizzleDb.getProjectById(projectId);

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

    // Read and parse specification file
    let spec: ArchitectSpec;
    try {
      const fullPath = resolve(specPath);
      const fileContent = await readFile(fullPath, 'utf-8');
      spec = yaml.parse(fileContent) as ArchitectSpec;
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to read specification file' },
        { status: 400 }
      );
    }

    // Build v0 prompt from specification
    const prompt = buildV0Prompt(spec);

    // Initialize v0 service
    const v0ApiKey = process.env.V0_API_KEY;
    if (!v0ApiKey) {
      return NextResponse.json(
        { error: 'v0 API key not configured' },
        { status: 500 }
      );
    }

    const v0Service = new V0IntegrationService(v0ApiKey);

    // Generate prototype via v0 API
    const v0Response = await v0Service.generate({
      prompt,
      framework: 'nextjs',
      styling: 'tailwind',
      designTokens: spec.design_tokens,
    });

    // Deploy to Quetrex-hosted environment
    const deploymentService = new PrototypeDeploymentService();
    const deployment = await deploymentService.deploy({
      projectName: project.name,
      prototypeId: `proto-${Date.now()}`, // Temporary ID, will be replaced
      files: v0Response.files,
    });

    // Store prototype in database with deployment information
    const prototype = await (drizzleDb as any).createPrototype({
      projectId,
      v0ChatId: v0Response.chatId,
      v0DemoUrl: v0Response.demoUrl,
      deploymentUrl: deployment.url,
      deploymentStatus: deployment.status,
      title,
      description: spec.description,
      specPath,
      files: v0Response.files,
      version: 1,
      parentId: null,
    });

    // Return response
    const response: GeneratePrototypeResponse = {
      prototypeId: prototype.id,
      deploymentUrl: prototype.deploymentUrl,
      deploymentId: deployment.deploymentId,
      status: prototype.deploymentStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Prototypes] Generate error:', error);

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate prototype' },
      { status: 500 }
    );
  }
}
