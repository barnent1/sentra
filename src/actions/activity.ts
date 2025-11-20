'use server'

import { DatabaseService, ActivityType } from '@/services/database';
import { revalidatePath } from 'next/cache';

const db = DatabaseService.getInstance();

/**
 * Server Action: Log a single activity
 * Edge-compatible activity logging
 */
export async function logActivity(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const type = formData.get('type') as ActivityType;
  const message = formData.get('message') as string;
  const metadataJson = formData.get('metadata') as string | undefined;

  // Validation
  if (!projectId || !type || !message) {
    return { error: 'Missing required fields: projectId, type, message' };
  }

  const validTypes: ActivityType[] = [
    'agent_started',
    'agent_completed',
    'agent_failed',
    'cost_alert',
    'project_created',
    'project_updated',
    'project_deleted',
  ];

  if (!validTypes.includes(type)) {
    return { error: `Invalid activity type. Must be one of: ${validTypes.join(', ')}` };
  }

  try {
    // Parse metadata if provided
    const metadata = metadataJson ? JSON.parse(metadataJson) : undefined;

    const activity = await db.createActivity({
      projectId,
      type,
      message,
      metadata,
    });

    // Revalidate cache
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${projectId}`);

    return { success: true, activity };
  } catch (error) {
    return { error: 'Failed to log activity' };
  }
}

/**
 * Server Action: Log multiple activities in bulk
 * Edge-compatible bulk activity logging for performance
 */
export async function bulkLogActivities(formData: FormData) {
  const activitiesJson = formData.get('activities') as string;

  // Validation
  if (!activitiesJson) {
    return { error: 'Activities data is required' };
  }

  try {
    const activities = JSON.parse(activitiesJson);

    if (!Array.isArray(activities)) {
      return { error: 'Activities must be an array' };
    }

    const validTypes: ActivityType[] = [
      'agent_started',
      'agent_completed',
      'agent_failed',
      'cost_alert',
      'project_created',
      'project_updated',
      'project_deleted',
    ];

    // Validate each activity entry
    for (const activity of activities) {
      if (!activity.projectId || !activity.type || !activity.message) {
        return { error: 'Each activity must have projectId, type, and message' };
      }

      if (!validTypes.includes(activity.type)) {
        return { error: `Invalid activity type: ${activity.type}` };
      }
    }

    await db.bulkCreateActivities(activities);

    // Revalidate cache for all affected projects
    const projectIds = [...new Set(activities.map((a: any) => a.projectId))];
    revalidatePath('/dashboard');
    projectIds.forEach(id => revalidatePath(`/projects/${id}`));

    return { success: true, count: activities.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to log activities: ${errorMessage}` };
  }
}

/**
 * Server Action: Get activities for a project
 * Edge-compatible activity retrieval with pagination
 */
export async function getProjectActivities(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const limit = formData.get('limit') ? parseInt(formData.get('limit') as string) : undefined;
  const offset = formData.get('offset') ? parseInt(formData.get('offset') as string) : undefined;

  // Validation
  if (!projectId) {
    return { error: 'Project ID is required' };
  }

  try {
    const activities = await db.getActivitiesByProject(projectId, {
      limit,
      offset,
    });

    return { success: true, activities };
  } catch (error) {
    return { error: 'Failed to get activities' };
  }
}

/**
 * Server Action: Get recent activities for a user
 * Edge-compatible recent activity retrieval
 */
export async function getRecentActivities(formData: FormData) {
  const userId = formData.get('userId') as string;
  const limit = formData.get('limit') ? parseInt(formData.get('limit') as string) : 10;

  // Validation
  if (!userId) {
    return { error: 'User ID is required' };
  }

  try {
    const activities = await db.getRecentActivities(userId, limit);

    return { success: true, activities };
  } catch (error) {
    return { error: 'Failed to get recent activities' };
  }
}
