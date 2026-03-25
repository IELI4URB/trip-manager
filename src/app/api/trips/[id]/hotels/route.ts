import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Hotels API
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.checkIn || !body.checkOut) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      );
    }
    
    const hotel = await prisma.hotel.create({
      data: {
        tripId: params.id,
        ...body,
        checkIn: new Date(body.checkIn),
        checkOut: new Date(body.checkOut),
      },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error('Failed to create hotel:', error);
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
  }
}
