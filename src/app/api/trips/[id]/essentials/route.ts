import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Essentials API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.essential.findMany({
      where: { tripId: params.id },
      orderBy: [{ isPacked: 'asc' }, { category: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch essentials:', error);
    return NextResponse.json({ error: 'Failed to fetch essentials' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Handle bulk creation
    if (Array.isArray(body)) {
      const items = [];
      for (const item of body) {
        const created = await prisma.essential.create({
          data: { tripId: params.id, ...item },
        });
        items.push(created);
      }
      return NextResponse.json(items);
    }

    const item = await prisma.essential.create({
      data: {
        tripId: params.id,
        ...body,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to create essential:', error);
    return NextResponse.json({ error: 'Failed to create essential' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const item = await prisma.essential.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update essential:', error);
    return NextResponse.json({ error: 'Failed to update essential' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    await prisma.essential.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete essential:', error);
    return NextResponse.json({ error: 'Failed to delete essential' }, { status: 500 });
  }
}
