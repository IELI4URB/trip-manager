import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Money & Cards API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.moneyCard.findMany({
      where: { tripId: params.id },
      orderBy: { type: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch money cards:', error);
    return NextResponse.json({ error: 'Failed to fetch money cards' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const item = await prisma.moneyCard.create({
      data: {
        tripId: params.id,
        ...body,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to create money card:', error);
    return NextResponse.json({ error: 'Failed to create money card' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const item = await prisma.moneyCard.update({
      where: { id },
      data,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update money card:', error);
    return NextResponse.json({ error: 'Failed to update money card' }, { status: 500 });
  }
}
