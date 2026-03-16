import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Food Places API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const places = await prisma.foodPlace.findMany({
      where: { tripId: params.id },
      orderBy: { isVisited: 'asc' },
    });

    return NextResponse.json(places);
  } catch (error) {
    console.error('Failed to fetch food places:', error);
    return NextResponse.json({ error: 'Failed to fetch food places' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      const places = [];
      for (const place of body) {
        const created = await prisma.foodPlace.create({
          data: { tripId: params.id, ...place },
        });
        places.push(created);
      }
      return NextResponse.json(places);
    }

    const place = await prisma.foodPlace.create({
      data: {
        tripId: params.id,
        ...body,
        visitDate: body.visitDate ? new Date(body.visitDate) : null,
      },
    });

    return NextResponse.json(place);
  } catch (error) {
    console.error('Failed to create food place:', error);
    return NextResponse.json({ error: 'Failed to create food place' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const place = await prisma.foodPlace.update({
      where: { id },
      data: {
        ...data,
        visitDate: data.visitDate ? new Date(data.visitDate) : null,
      },
    });

    return NextResponse.json(place);
  } catch (error) {
    console.error('Failed to update food place:', error);
    return NextResponse.json({ error: 'Failed to update food place' }, { status: 500 });
  }
}
