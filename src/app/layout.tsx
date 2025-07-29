import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gemini Template - Tom Naberink',
  description: 'Een template om te werken met Gemini AI - Gemaakt door Tom Naberink',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-100 min-h-screen" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
} 