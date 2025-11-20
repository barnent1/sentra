/**
 * API endpoint for generating ephemeral OpenAI Realtime API tokens
 * These tokens are short-lived (60 seconds) and used for WebRTC authentication
 * This keeps the main API key secure on the server
 */

import { NextRequest, NextResponse } from 'next/server';

// Enable Vercel Edge Runtime for faster response times
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get OpenAI API key from request body (passed from Tauri settings)
    // Falls back to environment variable for development
    const body = await request.json();
    const apiKey = body.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[Realtime Token API] No API key provided in request or environment');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set your API key in Settings.' },
        { status: 500 }
      );
    }

    console.log('[Realtime Token API] Requesting ephemeral token from OpenAI...');

    // Request ephemeral token from OpenAI
    // Note: Voice is configured in session.update, not here
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        // Voice will be set via session.update in the client
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Realtime Token API] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        {
          error: 'Failed to create ephemeral token',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Realtime Token API] Response structure:', {
      hasClientSecret: !!data.client_secret,
      clientSecretType: typeof data.client_secret,
      hasValue: data.client_secret ? !!data.client_secret.value : false,
      hasExpiresAt: data.client_secret ? !!data.client_secret.expires_at : false,
      keys: Object.keys(data),
    });

    // Validate response structure
    if (!data.client_secret || typeof data.client_secret !== 'object') {
      console.error('[Realtime Token API] Unexpected response format:', data);
      return NextResponse.json(
        { error: 'Unexpected response format from OpenAI API' },
        { status: 500 }
      );
    }

    if (!data.client_secret.value) {
      console.error('[Realtime Token API] Missing client_secret.value in response:', data);
      return NextResponse.json(
        { error: 'Missing token value in OpenAI response' },
        { status: 500 }
      );
    }

    console.log('[Realtime Token API] Successfully generated ephemeral token');

    // Return the ephemeral token to the client
    return NextResponse.json({
      client_secret: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
    });
  } catch (error) {
    console.error('[Realtime Token API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Realtime Token API] Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
