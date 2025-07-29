import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Available voice options with descriptions
const GEMINI_VOICES = [
  { name: 'Zephyr', style: 'Bright' },
  { name: 'Puck', style: 'Upbeat' },
  { name: 'Charon', style: 'Informative' },
  { name: 'Kore', style: 'Firm' },
  { name: 'Fenrir', style: 'Excitable' },
  { name: 'Leda', style: 'Youthful' },
  { name: 'Orus', style: 'Firm' },
  { name: 'Aoede', style: 'Breezy' },
  { name: 'Callirrhoe', style: 'Easy-going' },
  { name: 'Autonoe', style: 'Bright' },
  { name: 'Enceladus', style: 'Breathy' },
  { name: 'Iapetus', style: 'Clear' },
  { name: 'Umbriel', style: 'Easy-going' },
  { name: 'Algieba', style: 'Smooth' },
  { name: 'Despina', style: 'Smooth' },
  { name: 'Erinome', style: 'Clear' },
  { name: 'Algenib', style: 'Gravelly' },
  { name: 'Rasalgethi', style: 'Informative' },
  { name: 'Laomedeia', style: 'Upbeat' },
  { name: 'Achernar', style: 'Soft' },
  { name: 'Alnilam', style: 'Firm' },
  { name: 'Schedar', style: 'Even' },
  { name: 'Gacrux', style: 'Mature' },
  { name: 'Pulcherrima', style: 'Forward' },
  { name: 'Achird', style: 'Friendly' },
  { name: 'Zubenelgenubi', style: 'Casual' },
  { name: 'Vindemiatrix', style: 'Gentle' },
  { name: 'Sadachbia', style: 'Lively' },
  { name: 'Sadaltager', style: 'Knowledgeable' },
  { name: 'Sulafat', style: 'Warm' }
]

// Helper function to validate voice name
function isValidVoice(voiceName: string): boolean {
  return GEMINI_VOICES.some(voice => voice.name === voiceName)
}

// Helper function to apply style prompting
function applyStylePrompt(text: string, style?: string): string {
  if (!style) return text
  
  const stylePrompts = {
    'happy': 'Say cheerfully and with enthusiasm:',
    'sad': 'Say in a somber, melancholic tone:',
    'excited': 'Say with great excitement and energy:',
    'calm': 'Say in a calm, peaceful manner:',
    'serious': 'Say in a serious, professional tone:',
    'whisper': 'Say in a soft whisper:',
    'dramatic': 'Say dramatically with emphasis:',
    'friendly': 'Say in a warm, friendly manner:',
    'formal': 'Say in a formal, business-like tone:',
    'casual': 'Say in a relaxed, casual way:'
  }
  
  const prompt = stylePrompts[style as keyof typeof stylePrompts]
  return prompt ? `${prompt} ${text}` : text
}

// Function to convert PCM audio to WAV format with proper headers
function createWAVBuffer(pcmBuffer: Buffer, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = sampleRate * channels * bitsPerSample / 8
  const blockAlign = channels * bitsPerSample / 8
  const dataSize = pcmBuffer.length
  const fileSize = 36 + dataSize
  
  const wavBuffer = Buffer.alloc(44 + dataSize)
  let offset = 0
  
  // RIFF header
  wavBuffer.write('RIFF', offset); offset += 4
  wavBuffer.writeUInt32LE(fileSize, offset); offset += 4
  wavBuffer.write('WAVE', offset); offset += 4
  
  // fmt chunk
  wavBuffer.write('fmt ', offset); offset += 4
  wavBuffer.writeUInt32LE(16, offset); offset += 4 // fmt chunk size
  wavBuffer.writeUInt16LE(1, offset); offset += 2  // audio format (PCM)
  wavBuffer.writeUInt16LE(channels, offset); offset += 2
  wavBuffer.writeUInt32LE(sampleRate, offset); offset += 4
  wavBuffer.writeUInt32LE(byteRate, offset); offset += 4
  wavBuffer.writeUInt16LE(blockAlign, offset); offset += 2
  wavBuffer.writeUInt16LE(bitsPerSample, offset); offset += 2
  
  // data chunk
  wavBuffer.write('data', offset); offset += 4
  wavBuffer.writeUInt32LE(dataSize, offset); offset += 4
  
  // Copy PCM data
  pcmBuffer.copy(wavBuffer, offset)
  
  return wavBuffer
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { 
          error: 'API configuratie ontbreekt. Check Environment Variables.',
          hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
        }, 
        { status: 500 }
      )
    }

    // Parse request data
    const body = await request.json()
    console.log('TTS request received:', { 
      textLength: body.text?.length, 
      voiceName: body.voiceName,
      style: body.style,
      multiSpeaker: body.multiSpeaker
    })
    
    const { 
      text, 
      voiceName = 'Kore', 
      style, 
      multiSpeaker = false,
      speakers 
    } = body

    // Input validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Tekst is vereist en moet een string zijn' },
        { status: 400 }
      )
    }

    if (text.length > 32000) {
      return NextResponse.json(
        { error: 'Tekst mag maximaal 32.000 karakters bevatten' },
        { status: 400 }
      )
    }

    if (!isValidVoice(voiceName)) {
      return NextResponse.json(
        { error: `Ongeldige stem: ${voiceName}. Gebruik een van de beschikbare Gemini stemmen.` },
        { status: 400 }
      )
    }

    // Use direct REST API call for TTS since SDK doesn't support TTS yet
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`
    
    // Apply style to text if provided
    const styledText = applyStylePrompt(text, style)

    let requestBody: any = {
      contents: [{ 
        role: 'user',
        parts: [{ text: styledText }] 
      }],
      generationConfig: {
        responseModalities: ['AUDIO']
      }
    }

    if (multiSpeaker && speakers && speakers.length > 0) {
      // Multi-speaker TTS
      console.log('Generating multi-speaker audio...')
      
      // Validate speakers
      if (speakers.length > 2) {
        return NextResponse.json(
          { error: 'Maximaal 2 sprekers worden ondersteund' },
          { status: 400 }
        )
      }

      for (const speaker of speakers) {
        if (!isValidVoice(speaker.voiceName)) {
          return NextResponse.json(
            { error: `Ongeldige stem voor spreker ${speaker.name}: ${speaker.voiceName}` },
            { status: 400 }
          )
        }
      }

      // Create speaker voice configs
      const speakerVoiceConfigs = speakers.map((speaker: any) => ({
        speaker: speaker.name,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: speaker.voiceName
          }
        }
      }))

      requestBody.generationConfig.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerVoiceConfigs
        }
      }
    } else {
      // Single-speaker TTS
      console.log('Generating single-speaker audio...')
      
      requestBody.generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }

    // Make REST API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini TTS API error:', error)
      throw new Error(`API call failed: ${response.status} ${error}`)
    }

    const result = await response.json()

    // Extract audio data
    const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    
    if (!audioData) {
      console.error('No audio data received from Gemini TTS')
      return NextResponse.json(
        { error: 'Geen audio data ontvangen van Gemini TTS' },
        { status: 500 }
      )
    }

    console.log('TTS generation successful, audio data length:', audioData.length)

    // Convert base64 to buffer (this is likely PCM data)
    const pcmBuffer = Buffer.from(audioData, 'base64')
    
    // Convert PCM to proper WAV format
    const wavBuffer = createWAVBuffer(pcmBuffer, 24000, 1, 16)
    
    console.log('WAV conversion completed:', {
      originalSize: pcmBuffer.length,
      wavSize: wavBuffer.length,
      hasWavHeader: wavBuffer.toString('ascii', 0, 4) === 'RIFF'
    })

    // Return proper WAV file
    return new Response(wavBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error: any) {
    console.error('TTS API error:', error)
    
    // Handle specific Gemini API errors
    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { 
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Rate limit exceeded'
        },
        { status: 429 }
      )
    }

    if (error.message?.includes('not supported')) {
      return NextResponse.json(
        { 
          error: 'TTS functionaliteit is momenteel niet beschikbaar.',
          details: error.message
        },
        { status: 503 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het genereren van audio',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Export available voices for frontend use
export async function GET() {
  return NextResponse.json({
    voices: GEMINI_VOICES,
    styles: [
      'happy',
      'sad', 
      'excited',
      'calm',
      'serious',
      'whisper',
      'dramatic',
      'friendly',
      'formal',
      'casual'
    ],
    maxTextLength: 32000,
    supportedLanguages: [
      'nl-NL', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 
      'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'ar-EG', 'hi-IN',
      'id-ID', 'ru-RU', 'th-TH', 'tr-TR', 'vi-VN', 'uk-UA',
      'pl-PL', 'ro-RO', 'bn-BD', 'mr-IN', 'ta-IN', 'te-IN'
    ]
  })
} 