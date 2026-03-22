'use client'

import { useState, useRef, useEffect } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface TutorChatWindowProps {
  messages: ChatMessage[]
  currentTranscript: string
  className?: string
}

export default function TutorChatWindow({
  messages,
  currentTranscript,
  className = '',
}: TutorChatWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isExpanded, messages, currentTranscript])

  const hasContent = messages.length > 0 || currentTranscript.trim().length > 0
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const displayText = currentTranscript.trim() || lastAssistantMessage?.content || ''

  return (
    <div
      className={`flex flex-col rounded-lg border border-[#E6ECE9] bg-white/60 overflow-hidden transition-all duration-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((e) => !e)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-white/40 transition-colors"
      >
        <p className="text-xs uppercase tracking-wider text-[#5C7069]">
          Tutor says
        </p>
        <svg
          className={`w-4 h-4 text-[#5C7069] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? 'max-h-64' : 'max-h-0'
        }`}
      >
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto p-3 pt-0 space-y-3"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === 'user'
                  ? 'text-[#5C7069] text-right'
                  : 'text-[#3F524C]'
              }`}
            >
              <span className="inline-block max-w-[90%] rounded-lg px-3 py-2 bg-white/60 border border-[#E6ECE9]">
                {msg.content}
              </span>
            </div>
          ))}
          {currentTranscript.trim() ? (
            <div className="text-sm text-[#3F524C]">
              <span className="inline-block max-w-[90%] rounded-lg px-3 py-2 bg-white/60 border border-[#E6ECE9]">
                {currentTranscript}
              </span>
            </div>
          ) : null}
          {messages.length === 0 && !currentTranscript.trim() ? (
            <p className="text-sm text-[#5C7069] py-2">
              Tutor responses will appear here
            </p>
          ) : null}
        </div>
      </div>

      {!isExpanded && (
        <div className="p-3 pt-0 border-t border-[#E6ECE9]/60">
          {hasContent ? (
            <p className="text-sm text-[#3F524C] leading-relaxed min-h-[2.5rem]">
              {displayText || (
                <span className="text-[#5C7069]">Tutor is responding...</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-[#5C7069] min-h-[2.5rem]">
              Tutor responses will appear here
            </p>
          )}
        </div>
      )}
    </div>
  )
}
