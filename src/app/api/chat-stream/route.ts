import { GoogleGenerativeAI, Tool } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Helper function to convert base64 to buffer
function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

// Google Search tool configuratie
const googleSearchTool = {
  googleSearch: {}
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { 
          error: 'API configuratie ontbreekt. Check Environment Variables.',
          hint: 'Voeg GEMINI_API_KEY toe aan je environment variables',
          debug: 'Environment variable GEMINI_API_KEY is not set'
        }, 
        { status: 500 }
      )
    }

    // Parse request data
    const body = await request.json()
    console.log('Received request body:', body)
    
    const { message, image, images, useGrounding = true, aiModel = 'smart' } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Bericht is vereist' },
        { status: 400 }
      )
    }

    // Input validation
    if (typeof message !== 'string' || message.length > 100000) {
      return NextResponse.json(
        { error: 'Bericht moet een string zijn van maximaal 100.000 karakters' },
        { status: 400 }
      )
    }

    // Selecteer het juiste model op basis van aiModel
    const modelName = aiModel === 'pro' ? 'gemini-2.5-pro-preview-06-05' :
                     aiModel === 'smart' ? 'gemini-2.5-flash-preview-05-20' :
                     'gemini-2.0-flash-exp' // internet
    const model = genAI.getGenerativeModel({ model: modelName })

    // Configureer tools array - grounding alleen voor Gemini 2.0 (internet model)
    const tools = (aiModel === 'internet' && useGrounding) ? [googleSearchTool] : []

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let result;
          
          // Helper function to generate content with fallback
          const generateStreamWithFallback = async (requestConfig: any) => {
            try {
              return await model.generateContentStream(requestConfig)
            } catch (error: any) {
              // If grounding fails, retry without tools
              if (useGrounding && (error.message?.includes('Search Grounding is not supported') || 
                                  error.message?.includes('google_search_retrieval is not supported'))) {
                console.log('Grounding not supported, retrying streaming without grounding...')
                const { tools, ...configWithoutTools } = requestConfig
                return await model.generateContentStream(configWithoutTools)
              }
              throw error
            }
          }
          
          if (images && images.length > 0) {
            // Multiple images - use new images array
            const imageParts = images.map((imageData: string) => {
              const imageBuffer = base64ToBuffer(imageData)
              return {
                inlineData: {
                  data: imageBuffer.toString('base64'),
                  mimeType: 'image/jpeg'
                }
              }
            })
            
            result = await generateStreamWithFallback({
              contents: [{ role: 'user', parts: [{ text: message }, ...imageParts] }],
              tools: tools
            })
          } else if (image) {
            // Backward compatibility - single image (legacy)
            const imageBuffer = base64ToBuffer(image)
            
            const imagePart = {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
              }
            }
            
            result = await generateStreamWithFallback({
              contents: [{ role: 'user', parts: [{ text: message }, imagePart] }],
              tools: tools
            })
          } else {
            // Text only
            result = await generateStreamWithFallback({
              contents: [{ role: 'user', parts: [{ text: message }] }],
              tools: tools
            })
          }

          // Stream the response token by token
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            
            if (chunkText) {
              // Check if controller is still open before sending
              try {
                const data = JSON.stringify({ 
                  token: chunkText,
                  timestamp: new Date().toISOString()
                })
                
                controller.enqueue(
                  new TextEncoder().encode(`data: ${data}\n\n`)
                )
              } catch (error) {
                console.log('Controller already closed, stopping stream')
                break
              }
            }
          }

          // Send completion signal only if controller is still open
          try {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            )
            
            controller.close()
          } catch (error) {
            console.log('Controller already closed during completion')
          }

        } catch (error) {
          console.error('Streaming error:', error)
          
          // Send error to client
          const errorData = JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : 'Streaming error occurred'
          })
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${errorData}\n\n`)
          )
          
          controller.close()
        }
      }
    })

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Streaming API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verwerken van je bericht',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 