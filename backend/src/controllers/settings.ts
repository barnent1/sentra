/**
 * Settings Controller
 *
 * Handles user settings management including encrypted API keys.
 * All endpoints require JWT authentication.
 */

import { Request, Response } from 'express';
import { drizzleDb } from '@/services/database-drizzle';
import { encryptValue, decryptValue } from '@/services/encryption';
import type { JWTPayload } from '../types';

/**
 * GET /api/settings
 * Fetch user settings with decrypted API keys
 */
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as JWTPayload;

    const settings = await drizzleDb.getSettingsByUserId(user.userId);

    if (!settings) {
      // Return default settings if none exist
      res.json({
        voiceSettings: { voiceId: 'alloy' },
        notificationSettings: { enabled: true, sound: true },
        language: 'en',
      });
      return;
    }

    // Decrypt API keys for response
    const decrypted = {
      ...settings,
      openaiApiKey: settings.openaiApiKey ? decryptValue(settings.openaiApiKey) : undefined,
      anthropicApiKey: settings.anthropicApiKey
        ? decryptValue(settings.anthropicApiKey)
        : undefined,
      githubToken: settings.githubToken ? decryptValue(settings.githubToken) : undefined,
    };

    res.json(decrypted);
  } catch (error) {
    console.error('[Settings] Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

/**
 * PUT /api/settings
 * Update user settings (encrypts API keys before storage)
 */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as JWTPayload;
    const data = req.body;

    // Validate that we have some data to update
    if (!data || Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No settings data provided' });
      return;
    }

    // Encrypt API keys before storage
    const encrypted: Record<string, any> = { ...data };

    if (data.openaiApiKey !== undefined && data.openaiApiKey !== null) {
      if (typeof data.openaiApiKey !== 'string') {
        res.status(400).json({ error: 'openaiApiKey must be a string' });
        return;
      }
      encrypted.openaiApiKey = data.openaiApiKey ? encryptValue(data.openaiApiKey) : null;
    }

    if (data.anthropicApiKey !== undefined && data.anthropicApiKey !== null) {
      if (typeof data.anthropicApiKey !== 'string') {
        res.status(400).json({ error: 'anthropicApiKey must be a string' });
        return;
      }
      encrypted.anthropicApiKey = data.anthropicApiKey
        ? encryptValue(data.anthropicApiKey)
        : null;
    }

    if (data.githubToken !== undefined && data.githubToken !== null) {
      if (typeof data.githubToken !== 'string') {
        res.status(400).json({ error: 'githubToken must be a string' });
        return;
      }
      encrypted.githubToken = data.githubToken ? encryptValue(data.githubToken) : null;
    }

    // Validate language if provided
    if (data.language !== undefined && typeof data.language !== 'string') {
      res.status(400).json({ error: 'language must be a string' });
      return;
    }

    // Update settings in database
    const updated = await drizzleDb.upsertSettings(user.userId, encrypted);

    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('[Settings] Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

/**
 * POST /api/settings/validate
 * Test API keys to verify they work
 */
export async function validateKeys(req: Request, res: Response): Promise<void> {
  try {
    const { openaiApiKey, anthropicApiKey } = req.body;
    const results: Record<string, boolean> = {};

    // Test OpenAI key
    if (openaiApiKey) {
      if (typeof openaiApiKey !== 'string') {
        res.status(400).json({ error: 'openaiApiKey must be a string' });
        return;
      }

      try {
        const openaiTest = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openaiApiKey}` },
        });
        results.openai = openaiTest.ok;
      } catch (error) {
        results.openai = false;
      }
    }

    // Test Anthropic key
    if (anthropicApiKey) {
      if (typeof anthropicApiKey !== 'string') {
        res.status(400).json({ error: 'anthropicApiKey must be a string' });
        return;
      }

      try {
        const anthropicTest = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        results.anthropic = anthropicTest.ok;
      } catch (error) {
        results.anthropic = false;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('[Settings] Validate keys error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
}
