import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/trips/[id]/itinerary - Get daily itinerary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get('day');

    const where: any = { tripId: id };
    if (dayNumber) {
      where.dayNumber = parseInt(dayNumber, 10);
    }

    const itinerary = await prisma.dailyItinerary.findMany({
      where,
      orderBy: { dayNumber: 'asc' },
    });

    // Parse JSON fields
    const parsedItinerary = itinerary.map((day) => ({
      ...day,
      items: JSON.parse(day.items as string),
      weatherNote: day.weatherNote ? JSON.parse(day.weatherNote as string) : null,
      alternateRoute: day.alternateRoute ? JSON.parse(day.alternateRoute as string) : null,
    }));

    return NextResponse.json({ itinerary: parsedItinerary });
  } catch (error) {
    console.error('Itinerary GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary' }, { status: 500 });
  }
}

// POST /api/trips/[id]/itinerary - Create or update itinerary day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check if day already exists
    const existingDay = await prisma.dailyItinerary.findFirst({
      where: {
        tripId: id,
        dayNumber: body.dayNumber,
      },
    });

    let result;
    const data = {
      date: new Date(body.date),
      dayNumber: body.dayNumber,
      title: body.title,
      items: JSON.stringify(body.items),
      weatherNote: body.weather ? JSON.stringify(body.weather) : null,
      rushHourNote: body.rushHourNotes?.join('; ') || null,
      totalDistance: body.totalDistance,
      totalDuration: body.totalDuration,
      isOptimized: body.isOptimized || false,
      alternateRoute: body.alternatives ? JSON.stringify(body.alternatives) : null,
      notes: body.notes,
    };

    if (existingDay) {
      result = await prisma.dailyItinerary.update({
        where: { id: existingDay.id },
        data,
      });
    } else {
      result = await prisma.dailyItinerary.create({
        data: {
          tripId: id,
          ...data,
        },
      });
    }

    return NextResponse.json({ success: true, day: result });
  } catch (error) {
    console.error('Itinerary POST error:', error);
    return NextResponse.json({ error: 'Failed to save itinerary' }, { status: 500 });
  }
}

// PATCH /api/trips/[id]/itinerary - Update specific itinerary item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dayId, itemIndex, updatedItem, action } = body;

    const day = await prisma.dailyItinerary.findUnique({
      where: { id: dayId },
    });

    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    const items = JSON.parse(day.items as string);

    switch (action) {
      case 'update':
        if (itemIndex >= 0 && itemIndex < items.length) {
          items[itemIndex] = { ...items[itemIndex], ...updatedItem };
        }
        break;

      case 'add':
        items.push(updatedItem);
        // Re-sort by time
        items.sort((a: any, b: any) => a.time.localeCompare(b.time));
        break;

      case 'remove':
        if (itemIndex >= 0 && itemIndex < items.length) {
          items.splice(itemIndex, 1);
        }
        break;

      case 'reorder':
        const { fromIndex, toIndex } = body;
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await prisma.dailyItinerary.update({
      where: { id: dayId },
      data: {
        items: JSON.stringify(items),
        isOptimized: false, // Mark as manually modified
      },
    });

    return NextResponse.json({
      success: true,
      day: {
        ...result,
        items: JSON.parse(result.items as string),
      },
    });
  } catch (error) {
    console.error('Itinerary PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update itinerary' }, { status: 500 });
  }
}

// DELETE /api/trips/[id]/itinerary - Delete itinerary day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get('dayId');
    const { id } = await params;

    if (dayId) {
      await prisma.dailyItinerary.delete({ where: { id: dayId } });
    } else {
      // Delete all itinerary for the trip
      await prisma.dailyItinerary.deleteMany({ where: { tripId: id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Itinerary DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete itinerary' }, { status: 500 });
  }
}
