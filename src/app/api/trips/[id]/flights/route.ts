import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Get all flights for a trip
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const flights = await prisma.flight.findMany({
      where: { tripId: params.id },
      orderBy: { departureTime: 'asc' },
    });
    return NextResponse.json(flights);
  } catch (error) {
    console.error('Failed to get flights:', error);
    return NextResponse.json({ error: 'Failed to get flights' }, { status: 500 });
  }
}

// Create a new flight
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

// Delete a flight by ID (passed in query string ?flightId=xxx)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get('flightId');
    
    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the flight belongs to this trip
    const flight = await prisma.flight.findFirst({
      where: { id: flightId, tripId: params.id },
    });
    
    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }
    
    await prisma.flight.delete({
      where: { id: flightId },
    });
    
    return NextResponse.json({ success: true, message: 'Flight deleted successfully' });
  } catch (error) {
    console.error('Failed to delete flight:', error);
    return NextResponse.json({ error: 'Failed to delete flight' }, { status: 500 });
  }
}
