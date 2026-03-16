import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Activities API
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const activity = await prisma.activity.create({
      data: {
        tripId: params.id,
        ...body,
        dateTime: new Date(body.dateTime),
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to create activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        dateTime: data.dateTime ? new Date(data.dateTime) : undefined,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to update activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
