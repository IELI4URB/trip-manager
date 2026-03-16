import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Visa Checklist API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.visaChecklistItem.findMany({
      where: { tripId: params.id },
      orderBy: [{ isCompleted: 'asc' }, { priority: 'desc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch visa checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch visa checklist' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Handle bulk creation for AI-generated checklists
    if (Array.isArray(body)) {
      const items = [];
      for (const item of body) {
        const created = await prisma.visaChecklistItem.create({
          data: {
            tripId: params.id,
            ...item,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          },
        });
        items.push(created);
      }
      return NextResponse.json(items);
    }

    const item = await prisma.visaChecklistItem.create({
      data: {
        tripId: params.id,
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to create visa checklist item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const item = await prisma.visaChecklistItem.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update visa checklist item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    await prisma.visaChecklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete visa checklist item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
