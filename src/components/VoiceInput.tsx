'use client'

import { useState, useEffect, useRef } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
}

// Add type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

export default function VoiceInput({ onTranscript, isDisabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Speech Recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognitionClass()
        const recognition = recognitionRef.current

        if (recognition) {
          // Configure speech recognition
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'nl-NL' // Dutch language, can be changed to 'en-US' for English

          recognition.onstart = () => {
            setIsListening(true)
          }

          recognition.onresult = (event) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' '
              } else {
                interimTranscript += transcript
              }
            }

            const fullTranscript = finalTranscript + interimTranscript
            setTranscript(fullTranscript)
            
            if (finalTranscript) {
              onTranscript(finalTranscript.trim())
            }
          }

          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
          }

          recognition.onend = () => {
            setIsListening(false)
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-xs text-gray-400 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>Spraakherkenning niet ondersteund</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={toggleListening}
        disabled={isDisabled}
        className={`p-3 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
            : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
        } ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        }`}
        title={isListening ? 'Stop opnemen' : 'Start spraakherkenning'}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Live transcript display */}
      {isListening && transcript && (
        <div className="max-w-xs p-2 bg-gray-100 rounded-lg text-xs text-gray-600 text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="italic">"{transcript}"</div>
        </div>
      )}

      {/* Instructions */}
      {!isListening && (
        <div className="text-xs text-gray-400 text-center max-w-xs">
          Klik op de microfoon om je vraag in te spreken
        </div>
      )}
    </div>
  )
} 