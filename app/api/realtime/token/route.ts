/**
 * Realtime API Token Route
 *
 * Mints ephemeral client secrets for the OpenAI Realtime API. The browser uses
 * these short-lived tokens to connect directly to OpenAI's WebRTC endpoint,
 * keeping our main API key secure on the server.
 *
 * Why ephemeral tokens instead of proxying SDP through our server?
 * - Proxying the WebRTC SDP exchange caused 504 Gateway Timeout (~16s)
 * - Token minting is fast (~1s); WebRTC negotiation happens client↔OpenAI
 */

import { NextResponse } from 'next/server'
import { getLanguageRestrictionInstruction } from '@/lib/languageInstructions'

function getEnvOrDefault(value: string | undefined, fallback: string): string {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : fallback
}

function getRequiredEnv(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

function getRequiredInstructionEnv(value: string | undefined): string | null {
  const normalized = getRequiredEnv(value)
  if (!normalized) return null
  return normalized.replace(/\\n/g, '\n')
}

/**
 * POST /api/realtime/token
 *
 * Creates an ephemeral token for the Realtime API. Called by the client
 * before establishing the WebRTC connection.
 *
 * Body: { language?: string } - optional; defaults to 'en'
 *
 * @returns { value: string } - Ephemeral token (e.g. "ek_...") for Authorization header
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const realtimeModel = getRequiredEnv(process.env.OPENAI_REALTIME_MODEL)
  if (!realtimeModel) {
    return NextResponse.json(
      { error: 'OPENAI_REALTIME_MODEL is not configured' },
      { status: 500 }
    )
  }

  const baseInstructions = getRequiredInstructionEnv(
    process.env.OPENAI_SOCRATIC_TUTOR_INSTRUCTIONS
  )
  if (!baseInstructions) {
    return NextResponse.json(
      { error: 'OPENAI_SOCRATIC_TUTOR_INSTRUCTIONS is not configured' },
      { status: 500 }
    )
  }

  let language = 'en'
  try {
    const body = await request.json()
    if (body?.language && typeof body.language === 'string') {
      language = body.language
    }
  } catch {
    // ignore parse errors; use default language
  }

  const languageRestriction = getLanguageRestrictionInstruction(language)
  const instructions = `${baseInstructions}\n\n${languageRestriction}`

  /**
   * Session config sent to OpenAI. See docs/TUTOR_DOCUMENTATION.md for why
   * output_modalities is ['audio'] only (not ['audio', 'text']).
   */
  const sessionConfig = {
    type: 'realtime',
    model: realtimeModel,
    instructions,
    output_modalities: ['audio'],
    audio: { output: { voice: 'marin' } },
  }

  try {
    const response = await fetch(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session: sessionConfig }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI client_secrets error:', err)
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: response.status }
      )
    }

    const data = (await response.json()) as { value?: string }
    if (!data.value) {
      return NextResponse.json(
        { error: 'No token in response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ value: data.value })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    )
  }
}
