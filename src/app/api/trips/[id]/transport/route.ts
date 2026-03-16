import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Transport API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transports = await prisma.transport.findMany({
      where: { tripId: params.id },
      orderBy: { scheduledTime: 'asc' },
    });

    return NextResponse.json(transports);
  } catch (error) {
    console.error('Failed to fetch transports:', error);
    return NextResponse.json({ error: 'Failed to fetch transports' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      const transports = [];
      for (const t of body) {
        const created = await prisma.transport.create({
          data: {
            tripId: params.id,
            ...t,
            scheduledTime: t.scheduledTime ? new Date(t.scheduledTime) : null,
          },
        });
        transports.push(created);
      }
      return NextResponse.json(transports);
    }

    const transport = await prisma.transport.create({
      data: {
        tripId: params.id,
        ...body,
        scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : null,
      },
    });

    return NextResponse.json(transport);
  } catch (error) {
    console.error('Failed to create transport:', error);
    return NextResponse.json({ error: 'Failed to create transport' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const transport = await prisma.transport.update({
      where: { id },
      data: {
        ...data,
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      },
    });

    return NextResponse.json(transport);
  } catch (error) {
    console.error('Failed to update transport:', error);
    return NextResponse.json({ error: 'Failed to update transport' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.transport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete transport:', error);
    return NextResponse.json({ error: 'Failed to delete transport' }, { status: 500 });
  }
}
