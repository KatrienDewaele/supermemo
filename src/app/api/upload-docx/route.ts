import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 })
    }

    // Check file type - now supports multiple formats
    const fileName = file.name.toLowerCase()
    const isDocx = fileName.endsWith('.docx')
    const isPdf = fileName.endsWith('.pdf')
    const isCsv = fileName.endsWith('.csv')
    
    if (!isDocx && !isPdf && !isCsv) {
      return NextResponse.json({ error: 'Ondersteunde formaten: .docx, .pdf, .csv' }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bestand is te groot (max 10MB)' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let textContent = ''
    let fileType = ''

    if (isDocx) {
      // Extract text from .docx using mammoth
      const result = await mammoth.extractRawText({ buffer })
      textContent = result.value
      fileType = 'Word Document (.docx)'
    } else if (isPdf) {
      // Extract text from .pdf using pdf-parse with dynamic import
      try {
        const pdfParse = (await import('pdf-parse')).default
        const pdfData = await pdfParse(buffer)
        textContent = pdfData.text
        fileType = 'PDF Document (.pdf)'
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return NextResponse.json({ error: 'Fout bij het lezen van het PDF bestand' }, { status: 400 })
      }
    } else if (isCsv) {
      // Parse CSV file
      try {
        const csvText = buffer.toString('utf-8')
        const lines = csvText.split('\n').filter(line => line.trim().length > 0)
        
        if (lines.length === 0) {
          return NextResponse.json({ error: 'CSV bestand is leeg' }, { status: 400 })
        }
        
        // Parse CSV into readable format
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const rows = lines.slice(1, Math.min(11, lines.length)) // Limit to first 10 rows for preview
        
        let formattedContent = `CSV Data (${lines.length - 1} rijen, ${headers.length} kolommen)\n\n`
        formattedContent += `Kolommen: ${headers.join(', ')}\n\n`
        
        // Add sample data
        formattedContent += 'Eerste 10 rijen:\n'
        rows.forEach((row, index) => {
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
          formattedContent += `${index + 1}. ${values.join(' | ')}\n`
        })
        
        if (lines.length > 11) {
          formattedContent += `\n... en nog ${lines.length - 11} rijen`
        }
        
        textContent = formattedContent
        fileType = 'CSV Data (.csv)'
      } catch (csvError) {
        console.error('CSV parsing error:', csvError)
        return NextResponse.json({ error: 'Fout bij het lezen van het CSV bestand' }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      fileType: fileType,
      content: textContent,
      wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: textContent.length
    })

  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwerken van het bestand' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'GET method not allowed. Use POST to upload files.' },
    { status: 405 }
  )
} 