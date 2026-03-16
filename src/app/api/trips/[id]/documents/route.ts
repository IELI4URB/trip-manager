import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/trips/[id]/documents - Get all documents for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = { tripId: id };
    if (type) {
      where.type = type;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/trips/[id]/documents - Create a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const document = await prisma.document.create({
      data: {
        tripId: id,
        type: body.type,
        name: body.name,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        extractedData: body.extractedData ? JSON.stringify(body.extractedData) : null,
        isVerified: body.isVerified || false,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        isEncrypted: body.isEncrypted ?? true,
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// DELETE /api/trips/[id]/documents - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
