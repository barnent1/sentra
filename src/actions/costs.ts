'use server'

import { DatabaseService } from '@/services/database';
import { revalidatePath } from 'next/cache';

const db = DatabaseService.getInstance();

/**
 * Server Action: Track a single cost entry
 * Edge-compatible cost tracking
 */
export async function trackCost(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const model = formData.get('model') as string;
  const provider = formData.get('provider') as 'openai' | 'anthropic';
  const inputTokens = formData.get('inputTokens')
    ? parseInt(formData.get('inputTokens') as string)
    : undefined;
  const outputTokens = formData.get('outputTokens')
    ? parseInt(formData.get('outputTokens') as string)
    : undefined;

  // Validation
  if (!projectId || isNaN(amount) || !model || !provider) {
    return { error: 'Missing required fields: projectId, amount, model, provider' };
  }

  if (amount < 0) {
    return { error: 'Amount must be positive' };
  }

  if (!['openai', 'anthropic'].includes(provider)) {
    return { error: 'Provider must be either "openai" or "anthropic"' };
  }

  try {
    const cost = await db.createCost({
      projectId,
      amount,
      model,
      provider,
      inputTokens,
      outputTokens,
    });

    // Revalidate cache
    revalidatePath('/dashboard');
    revalidatePath(`/projects/${projectId}`);

    return { success: true, cost };
  } catch (error) {
    return { error: 'Failed to track cost' };
  }
}

/**
 * Server Action: Track multiple cost entries in bulk
 * Edge-compatible bulk cost tracking for performance
 */
export async function bulkTrackCosts(formData: FormData) {
  const costsJson = formData.get('costs') as string;

  // Validation
  if (!costsJson) {
    return { error: 'Costs data is required' };
  }

  try {
    const costs = JSON.parse(costsJson);

    if (!Array.isArray(costs)) {
      return { error: 'Costs must be an array' };
    }

    // Validate each cost entry
    for (const cost of costs) {
      if (!cost.projectId || typeof cost.amount !== 'number' || !cost.model || !cost.provider) {
        return { error: 'Each cost entry must have projectId, amount, model, and provider' };
      }

      if (cost.amount < 0) {
        return { error: 'All amounts must be positive' };
      }

      if (!['openai', 'anthropic'].includes(cost.provider)) {
        return { error: 'Provider must be either "openai" or "anthropic"' };
      }
    }

    await db.bulkCreateCosts(costs);

    // Revalidate cache for all affected projects
    const projectIds = [...new Set(costs.map((c: any) => c.projectId))];
    revalidatePath('/dashboard');
    projectIds.forEach(id => revalidatePath(`/projects/${id}`));

    return { success: true, count: costs.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to track costs: ${errorMessage}` };
  }
}

/**
 * Server Action: Get total cost for a project
 * Edge-compatible cost aggregation
 */
export async function getProjectTotalCost(formData: FormData) {
  const projectId = formData.get('projectId') as string;

  // Validation
  if (!projectId) {
    return { error: 'Project ID is required' };
  }

  try {
    const totalCost = await db.getTotalCostByProject(projectId);

    return { success: true, totalCost };
  } catch (error) {
    return { error: 'Failed to get total cost' };
  }
}

/**
 * Server Action: Get costs for a project
 * Edge-compatible cost retrieval
 */
export async function getProjectCosts(formData: FormData) {
  const projectId = formData.get('projectId') as string;

  // Validation
  if (!projectId) {
    return { error: 'Project ID is required' };
  }

  try {
    const costs = await db.getCostsByProject(projectId);

    return { success: true, costs };
  } catch (error) {
    return { error: 'Failed to get costs' };
  }
}

/**
 * Server Action: Get costs by time range
 * Edge-compatible time-based cost retrieval
 */
export async function getCostsByTimeRange(formData: FormData) {
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;

  // Validation
  if (!startDateStr || !endDateStr) {
    return { error: 'Start date and end date are required' };
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { error: 'Invalid date format' };
    }

    const costs = await db.getCostsByTimeRange(startDate, endDate);

    return { success: true, costs };
  } catch (error) {
    return { error: 'Failed to get costs by time range' };
  }
}
