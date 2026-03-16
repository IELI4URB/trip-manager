import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { startDate: 'asc' },
      include: {
        flights: true,
        hotels: true,
        activities: true,
      },
    });

    // Update trip statuses based on dates
    const now = new Date();
    const updatedTrips = trips.map((trip) => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      let status = trip.status;

      if (now < start && status !== 'planning') {
        status = 'upcoming';
      } else if (now >= start && now <= end) {
        status = 'active';
      } else if (now > end) {
        status = 'completed';
      }

      return { ...trip, status };
    });

    return NextResponse.json(updatedTrips);
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, destination, country, startDate, endDate, notes } = body;

    const trip = await prisma.trip.create({
      data: {
        name,
        destination,
        country,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        status: 'planning',
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
