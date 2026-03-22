/**
 * Tutor Page
 *
 * Main UI for the real-time math tutor. Implements Phases 1.1, 1.2, 1.3:
 * - 1.1: Voice-only (connect, speak, tutor responds)
 * - 1.2: File upload (images/PDFs as problem context)
 * - 1.3: Text input (equations, steps, clarifications)
 *
 * All three input modes work independently or in combination. The user can
 * use voice only, text only, file only, or any combination.
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
// @ts-expect-error - Editor is exported at runtime but TypeScript definitions may be incomplete
import type { Editor } from 'tldraw'
import TutorAvatar from '@/components/TutorAvatar'
import TutorChatWindow from '@/components/TutorChatWindow'
import FileUpload from '@/components/FileUpload'
import TextInput from '@/components/TextInput'
import EmbeddedBoard, { type EmbeddedBoardRef } from '@/components/EmbeddedBoard'
import { useRealtimeTutor } from '@/hooks/useRealtimeTutor'
import { useCanvasChangeDetection } from '@/hooks/useCanvasChangeDetection'
import Link from 'next/link'

export default function TutorPage() {
  const [error, setError] = useState<string | null>(null)
  const [streamCanvas, setStreamCanvas] = useState(true)
  const [language, setLanguage] = useState<string>('en')
  const [editor, setEditor] = useState<Editor | null>(null)
  const embeddedBoardRef = useRef<EmbeddedBoardRef>(null)
  const sendCanvasToTutorRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const lastSentCanvasHashRef = useRef<string | null>(null)

  // Stores uploaded image/PDF (as base64) until user sends or removes it
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string
    mimeType: string
  } | null>(null)

  const {
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
  } = useRealtimeTutor({
    onError: (userMsg) => setError(userMsg),
    onSpeechStarted: () => sendCanvasToTutorRef.current(),
  })

  const sendCanvasToTutor = useCallback(
    async (forceSend = false) => {
      if (!streamCanvas || !editor) return
      const shapeIds = [...editor.getCurrentPageShapeIds()].sort()
      const parts = shapeIds.map((id) => {
        const b = editor.getShapePageBounds(id)
        return `${id}:${b?.x ?? 0},${b?.y ?? 0},${b?.w ?? 0},${b?.h ?? 0}`
      })
      const data = parts.join('|')
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
      const hash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16)
      if (!forceSend && hash === lastSentCanvasHashRef.current) return
      const result = await embeddedBoardRef.current?.captureViewport()
      if (result) {
        sendCanvasImage(result.base64, result.mimeType)
        lastSentCanvasHashRef.current = hash
      }
    },
    [sendCanvasImage, streamCanvas, editor]
  )

  sendCanvasToTutorRef.current = () => {
    if (streamCanvas && editor) {
      return sendCanvasToTutor(true)
    }
    return Promise.resolve()
  }

  useEffect(() => {
    if (!isConnected) lastSentCanvasHashRef.current = null
  }, [isConnected])

  useCanvasChangeDetection(editor, () => {
    void sendCanvasToTutor(false)
  }, {
    debounceMs: 2500,
    enabled: isConnected && streamCanvas && !isPaused,
  })

  /** Stores the uploaded file locally. Does NOT send yet - user can add text or click "Get help". */
  const handleUpload = (base64: string, mimeType: string) => {
    setUploadedImage({ base64, mimeType })
  }

  /** Sends image only (no text). User clicked "Get help with this problem". */
  const handleSendImageOnly = () => {
    if (uploadedImage) {
      if (streamCanvas && isConnected && editor) void sendCanvasToTutor(true)
      sendImage(uploadedImage.base64, uploadedImage.mimeType)
      setUploadedImage(null)
    }
  }

  /**
   * Sends text, optionally with the pending image.
   * If uploadedImage exists, sends both in one message (text + image).
   */
  const handleTextSend = (text: string) => {
    if (streamCanvas && isConnected && editor) void sendCanvasToTutor(true)
    if (uploadedImage) {
      sendTextWithImage(text, uploadedImage.base64, uploadedImage.mimeType)
      setUploadedImage(null)
    } else {
      sendText(text)
    }
  }

  const clearUploadedImage = () => setUploadedImage(null)

  const avatarState = state === 'listening' && (isPaused || isMuted) ? 'waiting' : state

  return (
    <div className="h-screen flex flex-col bg-[#F2F5F4]">
      <nav className="flex-shrink-0 w-full px-6 py-6 md:px-12 flex justify-between items-center border-b border-[#D1DBD7] gap-4">
        <Link
          href="/"
          className="text-2xl tracking-tight font-medium serif italic text-[#16423C] hover:text-[#0A2621]"
        >
          Lemma.
        </Link>
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border border-[#A3B8B2] rounded-sm pl-3 pr-8 py-1.5 text-[#3F524C] bg-white focus:ring-[#16423C] focus:border-[#16423C] appearance-none bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233F524C'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")" }}
          >
            <option value="en">English</option>
          </select>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-[#3F524C] hover:text-[#16423C] transition-colors"
          >
            Back
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Tutor panel */}
        <div className="flex flex-col w-full md:w-[40%] md:min-w-0 overflow-y-auto p-6 items-center justify-center">
          <div className="max-w-md w-full flex flex-col items-center gap-8 text-center">
            {!isConnected && (
              <h1 className="serif text-3xl md:text-4xl italic text-[#0F2922]">
                Math Tutor
              </h1>
            )}
            <p className="text-[#3F524C] text-sm max-w-sm">
              Use voice, type equations, or upload a problem. Use any combination
              that works for you.
            </p>

            {!isConnected ? (
              <TutorAvatar state={avatarState} />
            ) : (
              <div className="flex flex-row items-center justify-center gap-4 md:gap-6 w-full">
                <TutorAvatar state={avatarState} />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={disconnect}
                    className="px-6 py-2 border border-[#A3B8B2] text-[#3F524C] rounded-sm hover:border-[#16423C] hover:text-[#16423C] transition-colors text-sm active:scale-[0.98]"
                  >
                    End session
                  </button>
                  <button
                    onClick={isPaused ? resume : pause}
                    className={`px-6 py-2 rounded-sm transition-colors text-sm active:scale-[0.98] ${
                      isPaused
                        ? 'bg-[#16423C] text-white border border-[#16423C]'
                        : 'border border-[#A3B8B2] text-[#3F524C] hover:border-[#16423C] hover:text-[#16423C]'
                    }`}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={isMuted ? unmute : mute}
                    className={`px-6 py-2 rounded-sm transition-colors text-sm active:scale-[0.98] ${
                      isMuted
                        ? 'bg-[#16423C] text-white border border-[#16423C]'
                        : 'border border-[#A3B8B2] text-[#3F524C] hover:border-[#16423C] hover:text-[#16423C]'
                    }`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {!isConnected ? (
              <>
                <button
                  onClick={() => {
                    setError(null)
                    connect({ language })
                  }}
                  className="px-8 py-3 bg-[#16423C] text-[#F2F5F4] rounded-sm hover:bg-[#0A2621] transition-colors font-medium"
                >
                  Start tutoring
                </button>
                {(chatHistory.length > 0) && (
                  <TutorChatWindow
                    messages={chatHistory}
                    currentTranscript=""
                    className="w-full"
                  />
                )}
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm text-[#3F524C] cursor-pointer mt-2 w-full justify-center">
                    <input
                      type="checkbox"
                      checked={streamCanvas}
                      onChange={(e) => setStreamCanvas(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors ${
                        streamCanvas
                          ? 'bg-[#16423C] border-[#16423C]'
                          : 'border-[#A3B8B2] bg-white'
                      }`}
                      aria-hidden
                    >
                      {streamCanvas && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>Stream canvas</span>
                  </label>

                <div className="w-full space-y-4 flex flex-col items-center max-w-sm">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <FileUpload
                      onUpload={handleUpload}
                      onError={setError}
                      disabled={state === 'thinking'}
                    />
                  </div>

                  {uploadedImage && (
                    <div className="flex flex-col gap-2 p-3 bg-white/60 rounded-lg border border-[#E6ECE9]">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`}
                            alt="Uploaded problem"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm text-[#3F524C] flex-1">
                          Problem ready. Add a message below or get help now.
                        </span>
                        <button
                          type="button"
                          onClick={clearUploadedImage}
                          className="text-[#5C7069] hover:text-[#16423C] text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendImageOnly}
                        disabled={state === 'thinking'}
                        className="self-center px-3 py-1.5 text-xs bg-[#16423C] text-white rounded hover:bg-[#0A2621] disabled:opacity-50"
                      >
                        Get help with this problem
                      </button>
                    </div>
                  )}

                  <TextInput
                    onSend={handleTextSend}
                    disabled={state === 'thinking'}
                    placeholder="Type equations, steps, or clarifications..."
                  />
                </div>

                <TutorChatWindow
                  messages={chatHistory}
                  currentTranscript={transcript}
                  className="w-full"
                />
              </>
            )}
          </div>
        </div>

        {/* Board panel */}
        <div className="flex flex-col w-full md:flex-1 min-h-[400px] md:min-h-0 p-4 md:p-6">
          <EmbeddedBoard
            ref={embeddedBoardRef}
            className="flex-1 min-h-0"
            onEditorReady={setEditor}
          />
        </div>
      </main>
    </div>
  )
}
