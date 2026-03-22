/**
 * useRealtimeTutor Hook
 *
 * Manages the full lifecycle of a Realtime API session: WebRTC connection,
 * audio streaming, data channel events, and sending text/image inputs.
 *
 * Flow:
 * 1. connect() → fetch ephemeral token → POST SDP to OpenAI → WebRTC established
 * 2. Audio: microphone → WebRTC track → OpenAI; OpenAI audio → WebRTC → autoplay
 * 3. Events: data channel receives JSON events (session, response, transcript)
 * 4. Text/Image: send via data channel conversation.item.create + response.create
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TutorState } from '@/components/TutorAvatar'

type UseRealtimeTutorOptions = {
  /** Called with user-friendly message (raw error logged to console) */
  onError?: (userMessage: string, rawError?: string) => void
  /** Called when user speech starts (for on-speech canvas send) */
  onSpeechStarted?: () => void
}

/**
 * Hook for managing the OpenAI Realtime API WebRTC session.
 *
 * @param options.onError - Called when connection fails or API returns an error
 * @returns { state, isConnected, transcript, connect, disconnect, sendText, sendImage, sendTextWithImage }
 */
const LEMMA_CANVAS_ITEM_ID = 'lemma_canvas_context'

function logErrorToServer(source: string, rawError?: string) {
  void fetch('/api/realtime/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, rawError: rawError ?? source }),
  }).catch(() => {})
}

export function useRealtimeTutor({ onError, onSpeechStarted }: UseRealtimeTutorOptions = {}) {
  const [state, setState] = useState<TutorState>('idle')
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const transcriptRef = useRef<string>('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const canvasItemIdRef = useRef<string | null>(null)

  /**
   * Closes the WebRTC connection and resets all state.
   * Called on disconnect button click or when the data channel closes.
   */
  const disconnect = useCallback(() => {
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null
    }
    audioTrackRef.current = null
    canvasItemIdRef.current = null
    setIsConnected(false)
    setIsPaused(false)
    setIsMuted(false)
    setTranscript('')
    transcriptRef.current = ''
    setState('idle')
  }, [])

  /**
   * Establishes the WebRTC connection to OpenAI's Realtime API.
   *
   * Steps:
   * 1. Create RTCPeerConnection with microphone track
   * 2. Create data channel "oai-events" for JSON events
   * 3. Fetch ephemeral token from our /api/realtime/token
   * 4. POST SDP offer directly to OpenAI (avoids server timeout)
   * 5. Set remote description with OpenAI's SDP answer
   */
  const connect = useCallback(async (options?: { language?: string }) => {
    try {
      setChatHistory([])
      setState('thinking')

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Hidden audio element for playing tutor's voice. Autoplay required for WebRTC.
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioRef.current = audioEl

      // When OpenAI sends audio, attach it to our audio element
      pc.ontrack = (e) => {
        if (e.streams[0]) {
          audioEl.srcObject = e.streams[0]
        }
      }

      // Add microphone as input track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      const track = ms.getTracks()[0]
      pc.addTrack(track)
      audioTrackRef.current = track

      // Data channel for JSON events (text input, image upload, server events)
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data)
          handleServerEvent(event)
        } catch {
          // ignore parse errors
        }
      })

      dc.addEventListener('open', () => {
        setIsConnected(true)
        setState('listening')
        if (audioTrackRef.current) audioTrackRef.current.enabled = true
      })

      dc.addEventListener('close', () => {
        disconnect()
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 1. Get ephemeral token from our server (fast, ~1s)
      const tokenRes = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: options?.language ?? 'en' }),
      })
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}))
        const errObj = err as { error?: string; details?: string }
        const rawErr = errObj.error || errObj.details || JSON.stringify(err)
        console.error('[Lemma Tutor] Token request failed:', rawErr)
        logErrorToServer('token', rawErr)
        throw new Error('Something went wrong. Please try again.')
      }
      const { value: ephemeralKey } = (await tokenRes.json()) as {
        value?: string
      }
      if (!ephemeralKey) {
        console.error('[Lemma Tutor] No token in response')
        logErrorToServer('token', 'No token in response')
        throw new Error('Something went wrong. Please try again.')
      }

      // 2. Client connects directly to OpenAI for WebRTC (avoids server timeout)
      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime/calls',
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
        }
      )

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text()
        console.error('[Lemma Tutor] WebRTC/session error:', errText)
        logErrorToServer('webrtc', errText)
        let errMsg = 'Something went wrong. Please try again.'
        try {
          const parsed = JSON.parse(errText)
          if (parsed.error?.message?.includes('504') || parsed.error?.message?.includes('timeout') || errText.includes('504') || errText.includes('timeout')) {
            errMsg = 'OpenAI is taking too long. Please try again.'
          }
        } catch {
          if (errText.includes('504') || errText.includes('timeout')) {
            errMsg = 'OpenAI is taking too long. Please try again.'
          }
        }
        throw new Error(errMsg)
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      const userMsg = rawMsg.includes('try again') ? rawMsg : 'Something went wrong. Please try again.'
      console.error('[Lemma Tutor] Connection error:', rawMsg)
      logErrorToServer('connection', rawMsg)
      onError?.(userMsg, rawMsg)
      setState('idle')
      disconnect()
    }
  }, [disconnect, onError])

  /**
   * Handles server-sent events from the Realtime API data channel.
   * Updates UI state (listening/thinking/speaking) and transcript.
   */
  const handleServerEvent = useCallback(
    (event: { type: string; [key: string]: unknown }) => {
      switch (event.type) {
        case 'session.created':
        case 'session.updated':
          setState('listening')
          break
        case 'conversation.item.added': {
          const item = (event as { item?: { id?: string; content?: Array<{ type?: string }> } })
            .item
          if (item?.id === LEMMA_CANVAS_ITEM_ID && item?.content?.some((c) => c.type === 'input_image')) {
            canvasItemIdRef.current = item.id ?? null
          }
          break
        }
        case 'input_audio_buffer.speech_started':
          onSpeechStarted?.()
          setState('listening')
          break
        case 'response.created':
          setState('thinking')
          setTranscript('')
          transcriptRef.current = ''
          break
        case 'response.output_audio_transcript.delta': {
          const delta = (event as { delta?: string }).delta ?? ''
          setTranscript((prev) => prev + delta)
          transcriptRef.current += delta
          break
        }
        case 'response.output_audio.delta':
          setState('speaking')
          break
        case 'response.output_audio.done':
          setState('listening')
          break
        case 'response.done': {
          const content = transcriptRef.current.trim()
          if (content) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content }])
          }
          setState('listening')
          break
        }
        case 'response.cancelled': {
          const content = transcriptRef.current.trim()
          if (content) {
            setChatHistory((prev) => [...prev, { role: 'assistant', content }])
          }
          setState('listening')
          break
        }
        case 'error': {
          const rawMsg = (event as { error?: { message?: string } }).error?.message ?? 'Unknown error'
          console.error('[Lemma Tutor] Session error:', rawMsg)
          logErrorToServer('session', rawMsg)
          onError?.('Something went wrong. Please try again.', rawMsg)
          setState('idle')
          break
        }
      }
    },
    [onError, onSpeechStarted]
  )

  /**
   * Sends a text message to the tutor and triggers a response.
   * Uses conversation.item.create (input_text) + response.create.
   */
  const sendText = useCallback((text: string) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return

    setChatHistory((prev) => [...prev, { role: 'user', content: text }])
    dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      })
    )
    dc.send(JSON.stringify({ type: 'response.create' }))
    setState('thinking')
  }, [])

  /**
   * Sends an image to the tutor and triggers a response.
   * Realtime API expects data:image/{format};base64,{data} for input_image.
   */
  const sendImage = useCallback((base64Data: string, mimeType: string) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return

    setChatHistory((prev) => [...prev, { role: 'user', content: '[Sent an image]' }])
    const format = mimeType.replace('image/', '')
    dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/${format};base64,${base64Data}`,
            },
          ],
        },
      })
    )
    dc.send(JSON.stringify({ type: 'response.create' }))
    setState('thinking')
  }, [])

  /**
   * Sends text and image together (e.g. "Help me with step 2" + problem image).
   * Both content parts go in a single conversation.item.create message.
   */
  const sendTextWithImage = useCallback(
    (text: string, base64Data: string, mimeType: string) => {
      const dc = dcRef.current
      if (!dc || dc.readyState !== 'open') return

      setChatHistory((prev) => [...prev, { role: 'user', content: text }])
      const format = mimeType.replace('image/', '')
      dc.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              { type: 'input_text', text },
              {
                type: 'input_image',
                image_url: `data:image/${format};base64,${base64Data}`,
              },
            ],
          },
        })
      )
      dc.send(JSON.stringify({ type: 'response.create' }))
      setState('thinking')
    },
    []
  )

  /**
   * Sends canvas image as context only (no response.create).
   * Uses replace strategy: deletes previous canvas item before adding new one.
   */
  const sendCanvasImage = useCallback((base64: string, mimeType: string = 'image/jpeg') => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return

    if (canvasItemIdRef.current) {
      dc.send(
        JSON.stringify({
          type: 'conversation.item.delete',
          item_id: canvasItemIdRef.current,
        })
      )
      canvasItemIdRef.current = null
    }

    const format = mimeType.replace('image/', '')
    dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          id: LEMMA_CANVAS_ITEM_ID,
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:image/${format};base64,${base64}`,
            },
          ],
        },
      })
    )
  }, [])

  const mute = useCallback(() => {
    setIsMuted(true)
    if (audioTrackRef.current) audioTrackRef.current.enabled = false
  }, [])

  const unmute = useCallback(() => {
    setIsMuted(false)
    if (audioTrackRef.current && !isPaused) {
      audioTrackRef.current.enabled = true
    }
  }, [isPaused])

  const pause = useCallback(() => {
    setIsPaused(true)
    if (audioTrackRef.current) audioTrackRef.current.enabled = false
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
    if (audioTrackRef.current && !isMuted) {
      audioTrackRef.current.enabled = true
    }
  }, [isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect()
  }, [disconnect])

  return {
    state,
    isConnected,
    isPaused,
    isMuted,
    transcript,
    chatHistory,
    connect,
    disconnect,
    sendText,
    sendImage,
    sendTextWithImage,
    sendCanvasImage,
    mute,
    unmute,
    pause,
    resume,
  }
}
