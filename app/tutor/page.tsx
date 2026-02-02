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

import { useState } from 'react'
import TutorAvatar, { type TutorState } from '@/components/TutorAvatar'
import FileUpload from '@/components/FileUpload'
import TextInput from '@/components/TextInput'
import { useRealtimeTutor } from '@/hooks/useRealtimeTutor'
import Link from 'next/link'

export default function TutorPage() {
  const [error, setError] = useState<string | null>(null)
  // Stores uploaded image/PDF (as base64) until user sends or removes it
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string
    mimeType: string
  } | null>(null)

  const {
    state,
    isConnected,
    transcript,
    connect,
    disconnect,
    sendText,
    sendImage,
    sendTextWithImage,
  } = useRealtimeTutor({
    onError: (msg) => setError(msg),
  })

  /** Stores the uploaded file locally. Does NOT send yet - user can add text or click "Get help". */
  const handleUpload = (base64: string, mimeType: string) => {
    setUploadedImage({ base64, mimeType })
  }

  /** Sends image only (no text). User clicked "Get help with this problem". */
  const handleSendImageOnly = () => {
    if (uploadedImage) {
      sendImage(uploadedImage.base64, uploadedImage.mimeType)
      setUploadedImage(null)
    }
  }

  /**
   * Sends text, optionally with the pending image.
   * If uploadedImage exists, sends both in one message (text + image).
   */
  const handleTextSend = (text: string) => {
    if (uploadedImage) {
      sendTextWithImage(text, uploadedImage.base64, uploadedImage.mimeType)
      setUploadedImage(null)
    } else {
      sendText(text)
    }
  }

  const clearUploadedImage = () => setUploadedImage(null)

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F4]">
      <nav className="w-full px-6 py-6 md:px-12 flex justify-between items-center border-b border-[#D1DBD7]">
        <Link
          href="/"
          className="text-2xl tracking-tight font-medium serif italic text-[#16423C] hover:text-[#0A2621]"
        >
          Lemma.
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-[#3F524C] hover:text-[#16423C] transition-colors"
        >
          Back
        </Link>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full flex flex-col items-center gap-8">
          <h1 className="serif text-3xl md:text-4xl italic text-[#0F2922] text-center">
            Math Tutor
          </h1>
          <p className="text-[#3F524C] text-center text-sm max-w-md">
            Use voice, type equations, or upload a problem. Use any combination
            that works for you.
          </p>

          <TutorAvatar state={state} />

          {error && (
            <div className="w-full p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={() => {
                setError(null)
                connect()
              }}
              className="px-8 py-3 bg-[#16423C] text-[#F2F5F4] rounded-sm hover:bg-[#0A2621] transition-colors font-medium"
            >
              Start tutoring
            </button>
          ) : (
            <>
              <button
                onClick={disconnect}
                className="px-6 py-2 border border-[#A3B8B2] text-[#3F524C] rounded-sm hover:border-[#16423C] hover:text-[#16423C] transition-colors text-sm"
              >
                End session
              </button>

              <div className="w-full space-y-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  <FileUpload
                    onUpload={handleUpload}
                    onError={setError}
                    disabled={state === 'thinking'}
                  />
                </div>

                {/* Preview of uploaded image; user can send alone or add text */}
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
                      className="self-start px-3 py-1.5 text-xs bg-[#16423C] text-white rounded hover:bg-[#0A2621] disabled:opacity-50"
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

              {/* Live transcript of tutor's spoken response (from output_audio_transcript) */}
              {transcript && (
                <div className="w-full p-4 rounded-lg bg-white/60 border border-[#E6ECE9]">
                  <p className="text-xs uppercase tracking-wider text-[#5C7069] mb-2">
                    Tutor says
                  </p>
                  <p className="text-sm text-[#3F524C] leading-relaxed">
                    {transcript}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
