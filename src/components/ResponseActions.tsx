'use client'

import { useState, useEffect, useRef } from 'react'
import { Document, Paragraph, TextRun } from 'docx'
import GeminiTTS, { GEMINI_VOICES, EMOTION_STYLES } from './GeminiTTS'

interface ResponseActionsProps {
  content: string
  isMarkdown?: boolean
  isStreaming?: boolean
  className?: string
}

export default function ResponseActions({ 
  content, 
  isMarkdown = true, 
  isStreaming = false,
  className = ""
}: ResponseActionsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')
  const [wordDownloadStatus, setWordDownloadStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'paused' | 'error' | 'waiting' | 'blocked'>('idle')
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [speechRate, setSpeechRate] = useState(1.0) // Default speech rate
  const [showSpeedControl, setShowSpeedControl] = useState(false)
  const [ttsAttempts, setTtsAttempts] = useState(0)
  const [ttsTimeoutId, setTtsTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [useGeminiTTS, setUseGeminiTTS] = useState(false) // Default to Microsoft TTS
  const [showUniversalSettings, setShowUniversalSettings] = useState(false) // Universal settings dropdown
  const [selectedGeminiVoice, setSelectedGeminiVoice] = useState(GEMINI_VOICES[3]) // Kore as default
  const [selectedGeminiEmotion, setSelectedGeminiEmotion] = useState(EMOTION_STYLES[0]) // Neutraal as default
  
  // Use ref to track speech state without causing re-renders
  const speechActiveRef = useRef(false)

  // Predefined speed options
  const speedOptions = [
    { label: '🐌 Langzaam', value: 0.75 },
    { label: '📚 Normaal', value: 1.0 },
    { label: '⚡ Snel', value: 1.5 },
    { label: '🚀 Allersnelst', value: 2.0 }
  ]

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('Loading voices:', voices.length, 'found')
      setAvailableVoices(voices)
      
      // Find the best available voice
      const bestVoice = findBestVoice(voices)
      setBestVoice(bestVoice)
      console.log('Best voice selected:', bestVoice?.name || 'none')
    }

    // Check if speech synthesis is available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices immediately
      loadVoices()
      
      // Also load when voices change (some browsers load async)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      // Fallback: try loading again after a short delay
      setTimeout(loadVoices, 100)
    } else {
      console.warn('Speech synthesis not supported in this browser')
    }
  }, [])

  // Smart voice selection - prefer high quality voices
  const findBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null

    // Priority order for better voices
    const priorities = [
      // Dutch voices (preferred)
      { lang: 'nl-NL', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'nl-BE', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'nl', quality: ['neural', 'premium', 'enhanced'] },
      
      // English voices (fallback)
      { lang: 'en-US', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'en-GB', quality: ['neural', 'premium', 'enhanced'] },
      { lang: 'en', quality: ['neural', 'premium', 'enhanced'] },
    ]

    // Try to find the best voice based on priorities
    for (const priority of priorities) {
      for (const qualityKeyword of priority.quality) {
        const voice = voices.find(v => 
          v.lang.toLowerCase().startsWith(priority.lang.toLowerCase()) &&
          (v.name.toLowerCase().includes(qualityKeyword) ||
           v.name.toLowerCase().includes('natural') ||
           v.name.toLowerCase().includes('wavenet') ||
           v.name.toLowerCase().includes('studio'))
        )
        if (voice) return voice
      }
      
      // If no premium voice found, try regular voices for this language
      const regularVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith(priority.lang.toLowerCase())
      )
      if (regularVoice) return regularVoice
    }

    // Final fallback - any voice
    return voices[0]
  }

  // Convert markdown to plain text for copying/speaking
  const convertMarkdownToPlainText = (markdown: string): string => {
    return markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove horizontal rules
      .replace(/^---+$/gm, '')
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  // Advanced markdown to Word document converter
  const convertMarkdownToWordDocument = (markdown: string): Document => {
    const lines = markdown.split('\n')
    const paragraphs: Paragraph[] = []
    let currentBulletList: string[] = []
    let currentNumberedList: Array<{number: string, text: string}> = []
    let isInCodeBlock = false
    let codeBlockContent = ''
    let codeBlockLanguage = ''
    let isInBlockquote = false
    let blockquoteContent: string[] = []

    // Flush different types of content
    const flushBulletList = () => {
      if (currentBulletList.length > 0) {
        currentBulletList.forEach(item => {
          const formattedRuns = parseInlineFormatting(item)
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: "• " }), ...formattedRuns],
            spacing: { after: 120 },
            indent: { left: 400 }
          }))
        })
        currentBulletList = []
      }
    }

    const flushNumberedList = () => {
      if (currentNumberedList.length > 0) {
        currentNumberedList.forEach(item => {
          const formattedRuns = parseInlineFormatting(item.text)
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `${item.number}. ` }), ...formattedRuns],
            spacing: { after: 120 },
            indent: { left: 400 }
          }))
        })
        currentNumberedList = []
      }
    }

    const flushCodeBlock = () => {
      if (codeBlockContent) {
        // Add language label if specified
        if (codeBlockLanguage) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ 
              text: `[${codeBlockLanguage.toUpperCase()}]`,
              italics: true,
              size: 18,
              color: "666666"
            })],
            spacing: { after: 80 }
          }))
        }
        
        // Split code into lines for better formatting
        const codeLines = codeBlockContent.trim().split('\n')
        codeLines.forEach(codeLine => {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ 
              text: codeLine || " ", // Empty line becomes space
              font: "Consolas",
              size: 20,
              color: "000080"
            })],
            spacing: { after: 40 },
            indent: { left: 400 },
            border: {
              left: { color: "CCCCCC", space: 1, style: "single", size: 6 }
            }
          }))
        })
        
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 200 }
        }))
        
        codeBlockContent = ''
        codeBlockLanguage = ''
      }
    }

    const flushBlockquote = () => {
      if (blockquoteContent.length > 0) {
        blockquoteContent.forEach(line => {
          const formattedRuns = parseInlineFormatting(line)
          paragraphs.push(new Paragraph({
            children: formattedRuns,
            spacing: { after: 120 },
            indent: { left: 600 },
            border: {
              left: { color: "4472C4", space: 1, style: "single", size: 12 }
            }
          }))
        })
        blockquoteContent = []
      }
    }

    // Parse inline formatting (bold, italic, code, links, strikethrough)
    const parseInlineFormatting = (text: string): TextRun[] => {
      const runs: TextRun[] = []
      
      // Enhanced regex to handle complex combinations
      const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|___[^_]+___|__[^_]+__|_[^_]+_|`[^`]+`|~~[^~]+~~|\[([^\]]+)\]\(([^)]+)\))/g
      
      let lastIndex = 0
      let match
      
      while ((match = regex.exec(text)) !== null) {
        // Add regular text before the match
        if (match.index > lastIndex) {
          const beforeText = text.slice(lastIndex, match.index)
          if (beforeText) {
            runs.push(new TextRun({ text: beforeText }))
          }
        }
        
        const matchedText = match[0]
        
        if (matchedText.startsWith('***') && matchedText.endsWith('***')) {
          // Bold + Italic
          runs.push(new TextRun({ 
            text: matchedText.slice(3, -3), 
            bold: true, 
            italics: true 
          }))
        } else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
          // Bold
          runs.push(new TextRun({ 
            text: matchedText.slice(2, -2), 
            bold: true 
          }))
        } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
          // Italic
          runs.push(new TextRun({ 
            text: matchedText.slice(1, -1), 
            italics: true 
          }))
        } else if (matchedText.startsWith('___') && matchedText.endsWith('___')) {
          // Bold + Italic (alternative)
          runs.push(new TextRun({ 
            text: matchedText.slice(3, -3), 
            bold: true, 
            italics: true 
          }))
        } else if (matchedText.startsWith('__') && matchedText.endsWith('__')) {
          // Bold (alternative)
          runs.push(new TextRun({ 
            text: matchedText.slice(2, -2), 
            bold: true 
          }))
        } else if (matchedText.startsWith('_') && matchedText.endsWith('_')) {
          // Italic (alternative)
          runs.push(new TextRun({ 
            text: matchedText.slice(1, -1), 
            italics: true 
          }))
        } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
          // Inline code
          runs.push(new TextRun({ 
            text: matchedText.slice(1, -1), 
            font: "Consolas",
            color: "DC143C",
            highlight: "yellow"
          }))
        } else if (matchedText.startsWith('~~') && matchedText.endsWith('~~')) {
          // Strikethrough
          runs.push(new TextRun({ 
            text: matchedText.slice(2, -2), 
            strike: true 
          }))
        } else if (matchedText.startsWith('[') && match[2] && match[3]) {
          // Links [text](url)
          runs.push(new TextRun({ 
            text: match[2],
            color: "0000EE",
            underline: {}
          }))
        }
        
        lastIndex = regex.lastIndex
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex)
        if (remainingText) {
          runs.push(new TextRun({ text: remainingText }))
        }
      }
      
      return runs.length > 0 ? runs : [new TextRun({ text: text })]
    }

    // Process each line
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      const originalLine = line

      // Handle code blocks
      const codeBlockMatch = trimmedLine.match(/^```(\w+)?/)
      if (codeBlockMatch) {
        if (isInCodeBlock) {
          flushCodeBlock()
          isInCodeBlock = false
        } else {
          flushBulletList()
          flushNumberedList()
          flushBlockquote()
          isInCodeBlock = true
          codeBlockLanguage = codeBlockMatch[1] || ''
        }
        return
      }

      if (isInCodeBlock) {
        codeBlockContent += originalLine + '\n'
        return
      }

      // Handle blockquotes
      const blockquoteMatch = trimmedLine.match(/^>\s*(.*)$/)
      if (blockquoteMatch) {
        if (!isInBlockquote) {
          flushBulletList()
          flushNumberedList()
          isInBlockquote = true
        }
        blockquoteContent.push(blockquoteMatch[1])
        return
      } else if (isInBlockquote) {
        flushBlockquote()
        isInBlockquote = false
      }

      // Handle horizontal rules
      if (trimmedLine.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushBulletList()
        flushNumberedList()
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "─────────────────────────────────" })],
          spacing: { after: 200, before: 200 },
          alignment: "center"
        }))
        return
      }

      // Handle headers
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        flushBulletList()
        flushNumberedList()
        const level = headerMatch[1].length
        const headerText = headerMatch[2]
        const formattedRuns = parseInlineFormatting(headerText)

        paragraphs.push(new Paragraph({
          children: formattedRuns.map(run => new TextRun({
            ...run,
            bold: true,
            size: level === 1 ? 32 : level === 2 ? 28 : level === 3 ? 24 : level === 4 ? 22 : level === 5 ? 20 : 18,
            color: level <= 2 ? "1F4E79" : "2F75B5"
          })),
          spacing: { after: 240, before: level === 1 ? 480 : 240 }
        }))
        return
      }

      // Handle bullet lists
      const bulletMatch = trimmedLine.match(/^([-*+])\s+(.+)$/)
      if (bulletMatch) {
        flushNumberedList()
        currentBulletList.push(bulletMatch[2])
        return
      }

      // Handle numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/)
      if (numberedMatch) {
        flushBulletList()
        currentNumberedList.push({
          number: numberedMatch[1],
          text: numberedMatch[2]
        })
        return
      }

      // Handle regular paragraphs
      if (trimmedLine) {
        flushBulletList()
        flushNumberedList()
        
        const formattedRuns = parseInlineFormatting(trimmedLine)
        paragraphs.push(new Paragraph({
          children: formattedRuns,
          spacing: { after: 200 }
        }))
      } else {
        // Empty line
        flushBulletList()
        flushNumberedList()
        if (index < lines.length - 1) { // Don't add spacing for last empty line
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: "" })],
            spacing: { after: 120 }
          }))
        }
      }
    })

    // Flush any remaining content
    flushBulletList()
    flushNumberedList()
    flushCodeBlock()
    flushBlockquote()

    return new Document({
      creator: "Chatbot AI Assistant",
      title: "AI Generated Response",
      description: "Professional document generated from AI chatbot response",
      sections: [{
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [
          new Paragraph({
            children: [new TextRun({ text: "No content available" })]
          })
        ]
      }]
    })
  }

  // Handle Word document download
  const handleWordDownload = async () => {
    if (isStreaming || !content.trim()) return

    setWordDownloadStatus('generating')
    
    try {
      // Import Packer dynamically to avoid SSR issues
      const { Packer } = await import('docx')
      
      const doc = convertMarkdownToWordDocument(content)
      const blob = await Packer.toBlob(doc)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename with timestamp
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')
      link.download = `Chatbot_Response_${timestamp}.docx`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      URL.revokeObjectURL(url)
      
      setWordDownloadStatus('success')
      setTimeout(() => setWordDownloadStatus('idle'), 2000)
    } catch (error) {
      console.error('Word download failed:', error)
      setWordDownloadStatus('error')
      setTimeout(() => setWordDownloadStatus('idle'), 3000)
    }
  }

  const handleCopy = async () => {
    if (isStreaming || !content.trim()) return

    setCopyStatus('copying')
    
    try {
      const textToCopy = isMarkdown ? convertMarkdownToPlainText(content) : content
      await navigator.clipboard.writeText(textToCopy)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  // Simplified and robust Text-to-Speech functionality
  const handleTextToSpeech = () => {
    if (isStreaming || !content.trim()) return

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      setTtsStatus('error')
      setTimeout(() => setTtsStatus('idle'), 3000)
      return
    }

    // If currently playing, pause/resume
    if (ttsStatus === 'playing') {
      window.speechSynthesis.pause()
      setTtsStatus('paused')
      return
    }

    // If paused, resume
    if (ttsStatus === 'paused') {
      window.speechSynthesis.resume()
      setTtsStatus('playing')
      return
    }

    // Start new speech - ALWAYS stop everything first
    startNewSpeech()
  }

  const startNewSpeech = () => {
    console.log('=== STARTING NEW SPEECH ===')
    
    // NUCLEAR OPTION: Stop everything and clear queue
    window.speechSynthesis.cancel()
    speechActiveRef.current = false
    
    // Clear any existing timeout
    if (ttsTimeoutId) {
      clearTimeout(ttsTimeoutId)
      setTtsTimeoutId(null)
    }

    // Wait a moment for queue to clear, then start fresh
    setTimeout(() => {
      const textToSpeak = isMarkdown ? convertMarkdownToPlainText(content) : content
      
      if (!textToSpeak.trim()) {
        console.warn('No text to speak')
        return
      }

      console.log('Text length:', textToSpeak.length, 'characters')
      console.log('Starting fresh speech with rate:', speechRate)

      setTtsStatus('waiting')

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      
      // Apply voice
      if (bestVoice) {
        utterance.voice = bestVoice
        utterance.lang = bestVoice.lang
      } else {
        utterance.lang = 'nl-NL'
      }

      // Apply settings
      utterance.rate = speechRate
      utterance.pitch = 1.1
      utterance.volume = 0.9

      // Simple event handlers
      utterance.onstart = () => {
        console.log('✅ Speech started successfully')
        speechActiveRef.current = true
        setTtsStatus('playing')
      }

      utterance.onend = () => {
        console.log('✅ Speech ended successfully')
        speechActiveRef.current = false
        setTtsStatus('idle')
        setCurrentUtterance(null)
      }

      utterance.onerror = (event) => {
        // "interrupted" is normal when we cancel speech to start new one
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.log('🔄 Speech was interrupted (normal behavior)')
          speechActiveRef.current = false
          // Don't set error status for interruptions - just go to idle
          setTtsStatus('idle')
          setCurrentUtterance(null)
        } else {
          // Only log real errors
          console.error('❌ Speech error:', event.error)
          speechActiveRef.current = false
          setTtsStatus('error')
          setTimeout(() => setTtsStatus('idle'), 3000)
          setCurrentUtterance(null)
        }
      }

      utterance.onpause = () => {
        setTtsStatus('paused')
      }

      utterance.onresume = () => {
        setTtsStatus('playing')
      }

      // Store and start
      setCurrentUtterance(utterance)
      window.speechSynthesis.speak(utterance)
      
      console.log('Speech queued and started')
    }, 200) // Wait 200ms for clean slate
  }

  const stopTextToSpeech = () => {
    console.log('🛑 Manually stopping all speech')
    
    // NUCLEAR STOP - clear everything
    window.speechSynthesis.cancel()
    speechActiveRef.current = false
    
    if (ttsTimeoutId) {
      clearTimeout(ttsTimeoutId)
      setTtsTimeoutId(null)
    }
    
    setTtsStatus('idle')
    setCurrentUtterance(null)
  }

  const changeSpeed = (newRate: number) => {
    setSpeechRate(newRate)
    
    // If currently playing, restart with new speed
    if (ttsStatus === 'playing') {
      console.log('🔄 Changing speed to', newRate, '- restarting speech')
      startNewSpeech()
    }
  }

  const toggleSpeedControl = () => {
    setShowSpeedControl(!showSpeedControl)
  }

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying': return '⏳ Kopiëren...'
      case 'success': return '✅ Gekopieerd!'
      case 'error': return '❌ Fout'
      default: return '📋 Kopiëren'
    }
  }

  const getCopyButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (copyStatus) {
      case 'success':
        return `${baseClass} bg-green-100 text-green-700 border border-green-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      case 'copying':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 border border-gray-200 hover:border-purple-200`
    }
  }

  const getTtsButtonText = () => {
    if (bestVoice) {
      switch (ttsStatus) {
        case 'playing': return '⏸️ Pauzeren'
        case 'paused': return '▶️ Hervatten'
        case 'waiting': return '⏳ Starten...'
        case 'error': return '❌ Fout'
        default: return `🔊 Uitspreken (${bestVoice.name.split(' ')[0]})`
      }
    } else {
      switch (ttsStatus) {
        case 'playing': return '⏸️ Pauzeren'
        case 'paused': return '▶️ Hervatten'
        case 'waiting': return '⏳ Starten...'
        case 'error': return '❌ Fout'
        default: return '🔊 Uitspreken'
      }
    }
  }

  const getTtsButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (ttsStatus) {
      case 'playing':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200 animate-pulse`
      case 'paused':
        return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200`
      case 'waiting':
        return `${baseClass} bg-orange-100 text-orange-700 border border-orange-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200`
    }
  }

  const getWordDownloadButtonText = () => {
    switch (wordDownloadStatus) {
      case 'generating': return '⏳ Genereren...'
      case 'success': return '✅ Gedownload!'
      case 'error': return '❌ Fout'
      default: return '📄 Download Word'
    }
  }

  const getWordDownloadButtonClass = () => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
    
    switch (wordDownloadStatus) {
      case 'success':
        return `${baseClass} bg-green-100 text-green-700 border border-green-200`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`
      case 'generating':
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`
      default:
        return `${baseClass} bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200`
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (ttsTimeoutId) {
        clearTimeout(ttsTimeoutId)
      }
      // Only cancel speech if component is unmounting, not on re-renders
    }
  }, [ttsTimeoutId])

  if (!content.trim()) return null

  return (
    <div className={`mt-3 ${className}`}>
      {/* Single Row with All Actions */}
      <div className="flex items-center justify-end space-x-2 relative">
        {/* Conditional TTS Component or Classic TTS */}
        {useGeminiTTS ? (
          <GeminiTTS
            content={content}
            isMarkdown={isMarkdown}
            isStreaming={isStreaming}
            selectedVoice={selectedGeminiVoice}
            selectedEmotion={selectedGeminiEmotion}
            hideSettings={true}
            className=""
          />
        ) : (
          <div className="flex items-center space-x-2">
            {/* Classic TTS Button */}
            <button
              onClick={handleTextToSpeech}
              disabled={isStreaming}
              className={getTtsButtonClass()}
              title={
                isStreaming ? "Wacht tot response compleet is" :
                ttsStatus === 'playing' ? "Pauzeer voorlezen" :
                ttsStatus === 'paused' ? "Hervat voorlezen" :
                bestVoice ? `Lees voor met ${bestVoice.name}` : "Lees voor"
              }
            >
              <span>{getTtsButtonText()}</span>
            </button>

            {/* Stop TTS Button - only show when playing or paused */}
            {(ttsStatus === 'playing' || ttsStatus === 'paused') && (
              <button
                onClick={stopTextToSpeech}
                className="p-2 rounded-lg text-sm transition-all duration-200 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
                title="Stop voorlezen"
              >
                ⏹️
              </button>
            )}
          </div>
        )}

        {/* Universal Settings Button */}
        <button
          onClick={() => setShowUniversalSettings(!showUniversalSettings)}
          className={`p-2 rounded-lg text-sm transition-all duration-200 ${
            showUniversalSettings 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 border border-gray-200'
          }`}
          title="TTS instellingen"
        >
          ⚙️
        </button>

        {/* Word Download Button */}
        <button
          onClick={handleWordDownload}
          disabled={isStreaming || wordDownloadStatus === 'generating'}
          className={getWordDownloadButtonClass()}
          title="Download als Word document"
        >
          <span>{getWordDownloadButtonText()}</span>
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={isStreaming || copyStatus === 'copying'}
          className={getCopyButtonClass()}
          title="Kopieer naar klembord"
        >
          <span>{getCopyButtonText()}</span>
        </button>
      </div>

      {/* Universal Settings Dropdown */}
      {showUniversalSettings && (
        <div className="absolute z-20 mt-2 right-0 w-96 p-4 bg-white border border-gray-200 rounded-lg shadow-xl space-y-4">
          {/* TTS Engine Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">🎙️ TTS Engine</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setUseGeminiTTS(false)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  !useGeminiTTS
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 border border-gray-200'
                }`}
              >
                🔊 Microsoft TTS
              </button>
              <button
                onClick={() => setUseGeminiTTS(true)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  useGeminiTTS
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 border border-gray-200'
                }`}
              >
                🚀 Gemini AI TTS
              </button>
            </div>
          </div>

          {/* Microsoft TTS Settings */}
          {!useGeminiTTS && (
            <div>
              <label className="block text-blue-700 text-sm font-medium mb-2">⚡ Spraaksnelheid</label>
              <div className="grid grid-cols-2 gap-2">
                {speedOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => changeSpeed(option.value)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                      speechRate === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-blue-600 text-xs text-center">
                Huidige snelheid: {speechRate}x
              </div>
            </div>
          )}

          {/* Gemini TTS Settings */}
          {useGeminiTTS && (
            <div className="space-y-4">
              <div>
                <label className="block text-purple-700 text-sm font-medium mb-2">🎭 Stemkeuze</label>
                <select
                  value={selectedGeminiVoice.name}
                  onChange={(e) => {
                    const voice = GEMINI_VOICES.find(v => v.name === e.target.value)
                    if (voice) setSelectedGeminiVoice(voice)
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
                      onClick={() => setSelectedGeminiEmotion(emotion)}
                      className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                        selectedGeminiEmotion.name === emotion.name
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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
      )}
    </div>
  )
} 