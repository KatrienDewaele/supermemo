import React, { useState, useRef, useEffect } from 'react'

// Available Gemini voices with their styles
export const GEMINI_VOICES = [
  { name: 'Zephyr', style: 'Bright', description: 'Helder en energiek' },
  { name: 'Puck', style: 'Upbeat', description: 'Opgewekt en vrolijk' },
  { name: 'Charon', style: 'Informative', description: 'Informatief en duidelijk' },
  { name: 'Kore', style: 'Firm', description: 'Stevig en zelfverzekerd' },
  { name: 'Fenrir', style: 'Excitable', description: 'Enthousiast en opwindend' },
  { name: 'Leda', style: 'Youthful', description: 'Jeugdig en fris' },
  { name: 'Orus', style: 'Firm', description: 'Vastberaden en krachtig' },
  { name: 'Aoede', style: 'Breezy', description: 'Luchtig en ontspannen' },
  { name: 'Callirrhoe', style: 'Easy-going', description: 'Relaxed en rustig' },
  { name: 'Autonoe', style: 'Bright', description: 'Stralend en positief' },
  { name: 'Enceladus', style: 'Breathy', description: 'Ademend en zacht' },
  { name: 'Iapetus', style: 'Clear', description: 'Helder en scherp' },
  { name: 'Umbriel', style: 'Easy-going', description: 'Gemakkelijk en vlot' },
  { name: 'Algieba', style: 'Smooth', description: 'Soepel en vloeiend' },
  { name: 'Despina', style: 'Smooth', description: 'Glad en harmonieus' },
  { name: 'Erinome', style: 'Clear', description: 'Kristalhelder' },
  { name: 'Algenib', style: 'Gravelly', description: 'Groverig en karakteristiek' },
  { name: 'Rasalgethi', style: 'Informative', description: 'Leerzaam en goed gestructureerd' },
  { name: 'Laomedeia', style: 'Upbeat', description: 'Opbeurend en positief' },
  { name: 'Achernar', style: 'Soft', description: 'Zacht en aangenaam' },
  { name: 'Alnilam', style: 'Firm', description: 'Standvastig en betrouwbaar' },
  { name: 'Schedar', style: 'Even', description: 'Gelijkmatig en evenwichtig' },
  { name: 'Gacrux', style: 'Mature', description: 'Volwassen en ervaren' },
  { name: 'Pulcherrima', style: 'Forward', description: 'Voorwaarts en gedecideerd' },
  { name: 'Achird', style: 'Friendly', description: 'Vriendelijk en toegankelijk' },
  { name: 'Zubenelgenubi', style: 'Casual', description: 'Informeel en ontspannen' },
  { name: 'Vindemiatrix', style: 'Gentle', description: 'Zachtaardig en mild' },
  { name: 'Sadachbia', style: 'Lively', description: 'Levendig en dynamisch' },
  { name: 'Sadaltager', style: 'Knowledgeable', description: 'Knap en geleerd' },
  { name: 'Sulafat', style: 'Warm', description: 'Warm en hartelijk' },
]

// Style options for emotional control
export const EMOTION_STYLES = [
  { name: 'Neutraal', prompt: '' },
  { name: 'Gelukkig', prompt: 'Spreek dit uit op een gelukkige, vrolijke manier: ' },
  { name: 'Enthousiast', prompt: 'Spreek dit uit met enthousiasme en energie: ' },
  { name: 'Kalm', prompt: 'Spreek dit uit op een kalme, rustgevende manier: ' },
  { name: 'Professioneel', prompt: 'Spreek dit uit op een professionele, zakelijke manier: ' },
  { name: 'Vriendelijk', prompt: 'Spreek dit uit op een vriendelijke, warme manier: ' },
  { name: 'Informatief', prompt: 'Spreek dit uit op een informatieve, educatieve manier: ' },
]

type TtsStatus = 'idle' | 'generating' | 'loading' | 'playing' | 'paused' | 'error'

interface GeminiTTSProps {
  content: string
  isMarkdown?: boolean
  isStreaming?: boolean
  className?: string
  selectedVoice?: typeof GEMINI_VOICES[0]
  selectedEmotion?: typeof EMOTION_STYLES[0]
  hideSettings?: boolean
}

export default function GeminiTTS({ 
  content, 
  isMarkdown = true, 
  isStreaming = false,
  className = "",
  selectedVoice: propSelectedVoice,
  selectedEmotion: propSelectedEmotion,
  hideSettings = false
}: GeminiTTSProps) {
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>('idle')
  const [selectedVoice, setSelectedVoice] = useState(propSelectedVoice || GEMINI_VOICES[3]) // Kore as default
  const [selectedEmotion, setSelectedEmotion] = useState(propSelectedEmotion || EMOTION_STYLES[0]) // Neutraal
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [progress, setProgress] = useState('')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Update local state when props change
  useEffect(() => {
    if (propSelectedVoice) {
      setSelectedVoice(propSelectedVoice)
    }
  }, [propSelectedVoice])

  useEffect(() => {
    if (propSelectedEmotion) {
      setSelectedEmotion(propSelectedEmotion)
    }
  }, [propSelectedEmotion])

  // Convert markdown to plain text
  const convertMarkdownToPlainText = (markdown: string): string => {
    return markdown
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic  
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '[Code]') // Code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^\s*[-*+]\s+/gm, '• ') // Lists
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/^\s*>\s+/gm, '') // Quotes
      .replace(/\n{2,}/g, ' ') // Multiple newlines to single space
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .trim()
  }

  // Extract first paragraph for ultra-fast TTS
  const getFirstParagraph = (text: string): string => {
    // Split on double newlines (paragraph breaks)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    
    if (paragraphs.length === 0) return text
    
    let firstParagraph = paragraphs[0].trim()
    
    // If first paragraph is very short (< 50 chars), include the second one too
    if (firstParagraph.length < 50 && paragraphs.length > 1) {
      firstParagraph = paragraphs.slice(0, 2).join(' ').trim()
    }
    
    // Limit to reasonable length for speed (max 800 chars)
    if (firstParagraph.length > 800) {
      // Split on sentences and take first few
      const sentences = firstParagraph.match(/[^.!?]+[.!?]+/g) || [firstParagraph]
      let result = ''
      for (const sentence of sentences) {
        if ((result + sentence).length <= 800) {
          result += sentence
        } else {
          break
        }
      }
      firstParagraph = result || sentences[0]
    }
    
    return firstParagraph
  }

  const generateTTS = async () => {
    if (isStreaming || !content.trim()) return

    // If currently playing, pause/resume
    if (ttsStatus === 'playing' && audioRef.current) {
      audioRef.current.pause()
      setTtsStatus('paused')
      return
    }

    if (ttsStatus === 'paused' && audioRef.current) {
      audioRef.current.play()
      setTtsStatus('playing')
      return
    }

    await startNewTTS()
  }

  const startNewTTS = async () => {
    setTtsStatus('generating')
    setProgress('Audio genereren...')

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      const textToSpeak = isMarkdown ? convertMarkdownToPlainText(content) : content
      const styledText = selectedEmotion.prompt + textToSpeak

      console.log('🚀 Generating TTS audio...', {
        textLength: textToSpeak.length,
        voice: selectedVoice.name,
        emotion: selectedEmotion.name
      })

      const response = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: styledText,
          voiceName: selectedVoice.name,
          multiSpeaker: false,
          style: selectedEmotion.name
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('TTS API Error:', response.status, errorText)
        throw new Error(`TTS API fout: ${response.status}`)
      }

      setTtsStatus('loading')
      setProgress('Audio laden...')

      const audioBlob = await response.blob()
      console.log('Audio blob created:', {
        type: audioBlob.type,
        size: audioBlob.size
      })

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio()
      audioRef.current = audio
      setCurrentAudio(audio)

      audio.onloadstart = () => {
        console.log('🔄 Audio loading started')
        setProgress('Audio wordt geladen...')
      }
      audio.oncanplay = () => {
        console.log('✅ Audio ready to play')
        setProgress('')
      }
      
      audio.onplay = () => {
        console.log('🎉 Audio playing')
        setTtsStatus('playing')
        setProgress('')
      }
      audio.onpause = () => setTtsStatus('paused')
      audio.onended = () => {
        console.log('✅ Audio playback completed')
        setTtsStatus('idle')
        setCurrentAudio(null)
        audioRef.current = null
        setProgress('')
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = (event) => {
        console.error('❌ Audio playback error:', event)
        setTtsStatus('error')
        setProgress('Afspeel fout')
        setTimeout(() => {
          setTtsStatus('idle')
          setProgress('')
        }, 3000)
        setCurrentAudio(null)
        audioRef.current = null
        URL.revokeObjectURL(audioUrl)
      }

      audio.src = audioUrl
      console.log('🎵 Starting audio playback...')
      
      try {
        await audio.play()
        console.log('✅ Audio playback started successfully!')
      } catch (playError) {
        console.error('❌ Play error:', playError)
        throw playError
      }

    } catch (error) {
      console.error('TTS Error:', error)
      setTtsStatus('error')
      setProgress('Er is een fout opgetreden')
      setTimeout(() => {
        setTtsStatus('idle')
        setProgress('')
      }, 3000)
    }
  }

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setCurrentAudio(null)
    setTtsStatus('idle')
    setProgress('')
  }

  const getTtsButtonText = () => {
    switch (ttsStatus) {
      case 'generating': return `🔄 ${progress || 'Genereren...'}`
      case 'loading': return `📥 ${progress || 'Laden...'}`
      case 'playing': return '⏸️ Pauzeren'
      case 'paused': return '▶️ Hervatten'
      case 'error': return `❌ ${progress || 'Fout'}`
      default: return `🔊 Gemini TTS (${selectedVoice.name})`
    }
  }

  const getTtsButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (ttsStatus) {
      case 'generating':
      case 'loading':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200 animate-pulse`
      case 'playing':
        return `${baseClass} bg-green-100 text-green-700 border border-green-200`
      case 'paused':
        return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200`
    }
  }

  if (!content.trim()) return null

  return (
    <div className={`${className}`}>
      {/* Horizontal Layout - Main TTS Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={generateTTS}
          disabled={isStreaming || ttsStatus === 'generating' || ttsStatus === 'loading'}
          className={getTtsButtonClass()}
          title={`Lees voor met ${selectedVoice.name} stem`}
        >
          <span className="truncate">{getTtsButtonText()}</span>
        </button>

        {!hideSettings && (
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className={`p-2 rounded-lg text-sm transition-all duration-200 ${
              showVoiceSettings 
                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                : 'bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 border border-gray-200'
            }`}
            title="Stem instellingen"
          >
            🎤
          </button>
        )}

        {(ttsStatus === 'playing' || ttsStatus === 'paused') && (
          <button
            onClick={stopTTS}
            className="p-2 rounded-lg text-sm transition-all duration-200 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
            title="Stop voorlezen"
          >
            ⏹️
          </button>
        )}
      </div>

      {/* Voice Settings Panel - Show below when toggled - Only if not hidden */}
      {!hideSettings && showVoiceSettings && (
        <div className="absolute z-10 mt-2 right-0 w-80 p-4 bg-purple-50 border border-purple-200 rounded-lg shadow-lg space-y-4">
          <div>
            <label className="block text-purple-700 text-sm font-medium mb-2">🎭 Stemkeuze</label>
            <select
              value={selectedVoice.name}
              onChange={(e) => {
                const voice = GEMINI_VOICES.find(v => v.name === e.target.value)
                if (voice) setSelectedVoice(voice)
              }}
              className="w-full p-2 border border-purple-200 rounded-lg bg-white text-purple-700"
            >
              {GEMINI_VOICES.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-purple-700 text-sm font-medium mb-2">😊 Emotie</label>
            <div className="grid grid-cols-3 gap-2">
              {EMOTION_STYLES.map((emotion) => (
                <button
                  key={emotion.name}
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                    selectedEmotion.name === emotion.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {emotion.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 