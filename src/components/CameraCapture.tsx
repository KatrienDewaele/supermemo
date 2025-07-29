'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraCaptureProps {
  onCapture: (imageData: string, blob: Blob) => void
  disabled?: boolean
}

export default function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError('')
      setIsLoading(true)
      setIsOpen(true)
      
      // Probeer eerst met achtercamera, fallback naar voorcamera
      let constraints = { 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment' // Voorkeur voor achtercamera op mobiel
        } 
      }
      
      let mediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (envError) {
        // Fallback naar voorcamera als achtercamera niet beschikbaar is
        console.log('Achtercamera niet beschikbaar, probeer voorcamera...')
        constraints.video.facingMode = 'user'
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      }
      
      setStream(mediaStream)
      
      // Wacht tot video element beschikbaar is en stel stream in
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Event listeners voor debugging
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata geladen')
          setIsLoading(false)
        }
        
        videoRef.current.oncanplay = () => {
          console.log('Video kan afspelen')
          setIsLoading(false)
        }
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e)
          setError('Probleem met video weergave')
          setIsLoading(false)
        }
        
        // Force play de video
        try {
          await videoRef.current.play()
        } catch (playError) {
          console.warn('Autoplay geblokkeerd, maar video zou zichtbaar moeten zijn')
        }
      }
      
    } catch (err) {
      console.error('Camera toegang geweigerd:', err)
      setError('Camera toegang vereist. Controleer je browser instellingen.')
      setIsLoading(false)
      setIsOpen(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsOpen(false)
    setError('')
    setIsLoading(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensies naar video dimensies
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Teken video frame op canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Converteer naar blob en base64
    canvas.toBlob((blob) => {
      if (blob) {
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        onCapture(imageData, blob)
        stopCamera()
      }
    }, 'image/jpeg', 0.8)
  }, [onCapture, stopCamera])

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={startCamera}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Maak een foto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {error && (
          <p className="text-xs text-red-600 text-center max-w-48">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Foto maken</h3>
          <button
            onClick={stopCamera}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="relative">
          {isLoading && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Camera wordt opgestart...</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full rounded-lg ${isLoading ? 'hidden' : 'block'}`}
            style={{ minHeight: '240px', backgroundColor: '#f3f4f6' }}
          />
          
          {error && (
            <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center">
              <p className="text-red-600 text-sm text-center px-4">{error}</p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={stopCamera}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={capturePhoto}
              disabled={isLoading || !stream}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Foto maken</span>
            </button>
          </div>
        </div>
        
        {/* Hidden canvas voor foto capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
} 