import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Flights API
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields - at least need departure and arrival times
    if (!body.departureTime || !body.arrivalTime) {
      return NextResponse.json(
        { error: 'Departure and arrival times are required' },
        { status: 400 }
      );
    }
    
    const flight = await prisma.flight.create({
      data: {
        tripId: params.id,
        ...body,
        departureTime: new Date(body.departureTime),
        arrivalTime: new Date(body.arrivalTime),
      },
    });

    return NextResponse.json(flight);
  } catch (error) {
    console.error('Failed to create flight:', error);
    return NextResponse.json({ error: 'Failed to create flight' }, { status: 500 });
  }
}
