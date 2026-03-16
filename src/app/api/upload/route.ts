import { NextResponse } from 'next/server';
import { parseDocumentWithAI } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();

    // Parse with AI
    const parsed = await parseDocumentWithAI(text);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Failed to parse document' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: parsed.type,
      data: parsed[parsed.type],
    });
  } catch (error) {
    console.error('Document parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
