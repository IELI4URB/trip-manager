import { NextRequest, NextResponse } from 'next/server';
import { parseDocument, processMultipleDocuments, parseEmailContent } from '@/lib/document-parser';

// POST /api/parse - Parse uploaded documents
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      
      if (!files.length) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }
      
      const results = [];
      
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // For images, convert to base64
        // For PDFs and text, extract content (simplified - in production use pdf-parse)
        let content: string;
        const mimeType = file.type;
        
        if (mimeType.startsWith('image/')) {
          content = buffer.toString('base64');
        } else if (mimeType === 'application/pdf') {
          // In production, use pdf-parse library
          // For now, we'll send the base64 to the AI for extraction
          content = buffer.toString('base64');
        } else {
          content = buffer.toString('utf-8');
        }
        
        const parsed = await parseDocument(content, mimeType, file.name);
        results.push({
          fileName: file.name,
          ...parsed,
        });
      }
      
      return NextResponse.json({
        success: true,
        documents: results,
      });
    } else {
      // Handle JSON input (for email content or base64 data)
      const body = await request.json();
      
      if (body.email) {
        // Parse email content
        const results = await parseEmailContent(body.email);
        return NextResponse.json({
          success: true,
          documents: results,
        });
      }
      
      if (body.documents) {
        // Process multiple documents
        const results = await processMultipleDocuments(body.documents);
        return NextResponse.json({
          success: true,
          documents: results,
        });
      }
      
      if (body.content && body.mimeType && body.fileName) {
        // Single document
        const result = await parseDocument(body.content, body.mimeType, body.fileName);
        return NextResponse.json({
          success: true,
          document: result,
        });
      }
      
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
