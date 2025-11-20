/**
 * Settings API Routes
 *
 * GET /api/settings - Fetch user settings with decrypted API keys
 * PUT /api/settings - Update user settings (encrypts API keys before storage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { encryptValue, decryptValue } from '@/services/encryption'

/**
 * GET /api/settings
 * Fetch user settings with decrypted API keys
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuthUser(request)

    const settings = await drizzleDb.getSettingsByUserId(user.userId)

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        voiceSettings: { voiceId: 'alloy' },
        notificationSettings: { enabled: true, sound: true },
        language: 'en',
      })
    }

    // Decrypt API keys for response
    const decrypted = {
      ...settings,
      openaiApiKey: settings.openaiApiKey
        ? decryptValue(settings.openaiApiKey)
        : undefined,
      anthropicApiKey: settings.anthropicApiKey
        ? decryptValue(settings.anthropicApiKey)
        : undefined,
      githubToken: settings.githubToken
        ? decryptValue(settings.githubToken)
        : undefined,
    }

    return NextResponse.json(decrypted)
  } catch (error) {
    console.error('[Settings] Get settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update user settings (encrypts API keys before storage)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const data = await request.json()

    // Validate that we have some data to update
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No settings data provided' },
        { status: 400 }
      )
    }

    // Encrypt API keys before storage
    const encrypted: Record<string, any> = { ...data }

    if (data.openaiApiKey !== undefined && data.openaiApiKey !== null) {
      if (typeof data.openaiApiKey !== 'string') {
        return NextResponse.json(
          { error: 'openaiApiKey must be a string' },
          { status: 400 }
        )
      }
      encrypted.openaiApiKey = data.openaiApiKey
        ? encryptValue(data.openaiApiKey)
        : null
    }

    if (data.anthropicApiKey !== undefined && data.anthropicApiKey !== null) {
      if (typeof data.anthropicApiKey !== 'string') {
        return NextResponse.json(
          { error: 'anthropicApiKey must be a string' },
          { status: 400 }
        )
      }
      encrypted.anthropicApiKey = data.anthropicApiKey
        ? encryptValue(data.anthropicApiKey)
        : null
    }

    if (data.githubToken !== undefined && data.githubToken !== null) {
      if (typeof data.githubToken !== 'string') {
        return NextResponse.json(
          { error: 'githubToken must be a string' },
          { status: 400 }
        )
      }
      encrypted.githubToken = data.githubToken
        ? encryptValue(data.githubToken)
        : null
    }

    // Validate language if provided
    if (data.language !== undefined && typeof data.language !== 'string') {
      return NextResponse.json(
        { error: 'language must be a string' },
        { status: 400 }
      )
    }

    // Update settings in database
    const updated = await drizzleDb.upsertSettings(user.userId, encrypted)

    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    console.error('[Settings] Update settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
