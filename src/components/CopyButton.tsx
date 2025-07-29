'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
  title?: string
}

export default function CopyButton({ text, className, title }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button 
      onClick={handleCopy}
      className={className}
      title={title}
    >
      📋 {copied ? 'Gekopieerd!' : 'Kopieer'}
    </button>
  )
}