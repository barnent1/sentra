'use server'

import { DatabaseService } from '@/services/database';
import { revalidatePath } from 'next/cache';

const db = DatabaseService.getInstance();

/**
 * Server Action: Create a new project
 * Edge-compatible project creation
 */
export async function createProject(formData: FormData) {
  const name = formData.get('name') as string;
  const path = formData.get('path') as string;
  const userId = formData.get('userId') as string;
  const settingsJson = formData.get('settings') as string;

  // Validation
  if (!name || !path || !userId) {
    return { error: 'Name, path, and userId are required' };
  }

  try {
    // Parse settings if provided
    const settings = settingsJson ? JSON.parse(settingsJson) : undefined;

    const project = await db.createProject({
      name,
      path,
      userId,
      settings,
    });

    // Revalidate cache
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${project.id}`);

    return { success: true, project };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('User not found')) {
      return { error: 'User not found' };
    }

    return { error: 'Failed to create project' };
  }
}

/**
 * Server Action: Update an existing project
 * Edge-compatible project updates
 */
export async function updateProject(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string | undefined;
  const path = formData.get('path') as string | undefined;
  const settingsJson = formData.get('settings') as string | undefined;

  // Validation
  if (!id) {
    return { error: 'Project ID is required' };
  }

  try {
    // Parse settings if provided
    const settings = settingsJson ? JSON.parse(settingsJson) : undefined;

    const project = await db.updateProject(id, {
      name,
      path,
      settings,
    });

    // Revalidate cache
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${id}`);

    return { success: true, project };
  } catch (error) {
    return { error: 'Failed to update project' };
  }
}

/**
 * Server Action: Delete a project
 * Edge-compatible project deletion
 */
export async function deleteProject(formData: FormData) {
  const id = formData.get('id') as string;

  // Validation
  if (!id) {
    return { error: 'Project ID is required' };
  }

  try {
    const deleted = await db.deleteProject(id);

    if (!deleted) {
      return { error: 'Project not found' };
    }

    // Revalidate cache
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete project' };
  }
}

/**
 * Server Action: Get project by ID
 * Edge-compatible project retrieval with optional relations
 */
export async function getProject(formData: FormData) {
  const id = formData.get('id') as string;
  const includeUser = formData.get('includeUser') === 'true';
  const includeAgents = formData.get('includeAgents') === 'true';
  const includeCosts = formData.get('includeCosts') === 'true';
  const includeActivities = formData.get('includeActivities') === 'true';

  // Validation
  if (!id) {
    return { error: 'Project ID is required' };
  }

  try {
    const project = await db.getProjectById(id, {
      includeUser,
      includeAgents,
      includeCosts,
      includeActivities,
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    return { success: true, project };
  } catch (error) {
    return { error: 'Failed to retrieve project' };
  }
}

/**
 * Server Action: List all projects for a user
 * Edge-compatible project listing
 */
export async function listUserProjects(formData: FormData) {
  const userId = formData.get('userId') as string;

  // Validation
  if (!userId) {
    return { error: 'User ID is required' };
  }

  try {
    const projects = await db.listProjectsByUser(userId);

    return { success: true, projects };
  } catch (error) {
    return { error: 'Failed to list projects' };
  }
}
