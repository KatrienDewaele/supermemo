'use client'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): string => {
    let html = text
    
    // Escape HTML eerst
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Headers (### ## #)
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h2>')
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-800 mt-6 mb-4">$1</h1>')
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
    
    // Italic (*text* or _text_) - eenvoudigere regex zonder lookbehind/lookahead
    html = html.replace(/\*([^*\n]+)\*/g, '<em class="italic">$1</em>')
    html = html.replace(/_([^_\n]+)_/g, '<em class="italic">$1</em>')
    
    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg my-2 overflow-x-auto"><code class="text-sm">$1</code></pre>')
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Lists
    // Unordered lists (- item or * item)
    html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
    
    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal list-inside">$1</li>')
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/((?:<li class="ml-4 mb-1">• .+<\/li>\s*)+)/g, '<ul class="my-2">$1</ul>')
    html = html.replace(/((?:<li class="ml-4 mb-1 list-decimal list-inside">.+<\/li>\s*)+)/g, '<ol class="my-2">$1</ol>')
    
    // Line breaks (double newline becomes paragraph break)
    html = html.replace(/\n\s*\n/g, '</p><p class="mb-3">')
    
    // Single line breaks
    html = html.replace(/\n/g, '<br />')
    
    // Wrap in paragraph if not starting with a block element
    if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
      html = '<p class="mb-3">' + html + '</p>'
    }
    
    return html
  }

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  )
} 