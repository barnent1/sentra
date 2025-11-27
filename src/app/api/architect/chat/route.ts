/**
 * Architect Chat API Route
 *
 * POST /api/architect/chat - Chat with the architect AI via Anthropic API
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-helpers'
import { drizzleDb } from '@/services/database-drizzle'
import { decryptValue } from '@/services/encryption'

// Use Node.js runtime for external API calls
export const runtime = 'nodejs'

interface ChatRequest {
  projectName: string
  message: string
  conversationHistory: Array<{
    role: string
    content: string
  }>
}

/**
 * POST /api/architect/chat
 * Chat with the architect AI
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request)
    const body = (await request.json()) as ChatRequest
    const { projectName, message, conversationHistory } = body

    // Validate required fields
    if (!projectName) {
      return NextResponse.json(
        { error: 'projectName is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    // Get user's Anthropic API key from database
    const settings = await drizzleDb.getSettingsByUserId(user.userId)

    if (!settings?.anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add it in Settings.' },
        { status: 400 }
      )
    }

    // Decrypt API key
    const anthropicApiKey = decryptValue(settings.anthropicApiKey)

    // Build messages array from conversation history
    const messages = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    // System prompt for the architect
    const systemPrompt = `You are Quetrex, an AI architect assistant for the project "${projectName}".
You help developers plan and design features, review code, and provide technical guidance.
Be concise, technical, and practical. Focus on actionable advice.`

    // Call Anthropic API from server (avoids CORS)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Anthropic API key' },
          { status: 401 }
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      } else {
        console.error('[Architect] Anthropic API error:', errorData)
        return NextResponse.json(
          {
            error:
              errorData.error?.message ||
              `API error: ${response.status} ${response.statusText}`,
          },
          { status: response.status }
        )
      }
    }

    const data = await response.json()

    // Extract text content from response
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      return NextResponse.json(
        { error: 'Invalid response format from Anthropic API' },
        { status: 500 }
      )
    }

    const textContent = data.content
      .filter((block: { type: string; text: string }) => block.type === 'text')
      .map((block: { type: string; text: string }) => block.text)
      .join('\n')

    if (!textContent) {
      return NextResponse.json(
        { error: 'No text content in response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: textContent })
  } catch (error) {
    console.error('[Architect] Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
