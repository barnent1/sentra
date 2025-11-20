/**
 * POST /api/settings/validate
 * Test API keys to verify they work
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'

interface ValidateKeysRequest {
  openaiApiKey?: string
  anthropicApiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    requireAuthUser(request)

    const body = await request.json() as ValidateKeysRequest
    const { openaiApiKey, anthropicApiKey } = body
    const results: Record<string, boolean> = {}

    // Test OpenAI key
    if (openaiApiKey) {
      if (typeof openaiApiKey !== 'string') {
        return NextResponse.json(
          { error: 'openaiApiKey must be a string' },
          { status: 400 }
        )
      }

      try {
        const openaiTest = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${openaiApiKey}` },
        })
        results.openai = openaiTest.ok
      } catch (error) {
        results.openai = false
      }
    }

    // Test Anthropic key
    if (anthropicApiKey) {
      if (typeof anthropicApiKey !== 'string') {
        return NextResponse.json(
          { error: 'anthropicApiKey must be a string' },
          { status: 400 }
        )
      }

      try {
        const anthropicTest = await fetch(
          'https://api.anthropic.com/v1/messages',
          {
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
          }
        )
        results.anthropic = anthropicTest.ok
      } catch (error) {
        results.anthropic = false
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[Settings] Validate keys error:', error)
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    )
  }
}
