import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/trips/[id]/emergency - Get all emergency data for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [emergencyContacts, safetyInfo, alerts] = await Promise.all([
      prisma.emergencyContact.findMany({
        where: { tripId: id },
        orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }],
      }),
      prisma.safetyInfo.findMany({
        where: { tripId: id, isActive: true },
        orderBy: { severity: 'desc' },
      }),
      prisma.travelAlert.findMany({
        where: { tripId: id, isDismissed: false },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return NextResponse.json({
      emergencyContacts,
      safetyInfo,
      alerts,
    });
  } catch (error) {
    console.error('Emergency GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency data' }, { status: 500 });
  }
}

// POST /api/trips/[id]/emergency - Create emergency contact or safety info
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, data } = body;

    // Verify trip exists
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    let result: any;

    switch (type) {
      case 'contact':
        result = await prisma.emergencyContact.create({
          data: {
            tripId: id,
            type: data.type,
            name: data.name,
            phoneNumber: data.phoneNumber,
            alternatePhone: data.alternatePhone,
            email: data.email,
            address: data.address,
            relationship: data.relationship,
            notes: data.notes,
            isPrimary: data.isPrimary || false,
          },
        });
        break;

      case 'safety':
        result = await prisma.safetyInfo.create({
          data: {
            tripId: id,
            type: data.type,
            title: data.title,
            description: data.description,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            severity: data.severity || 'medium',
            source: data.source,
            isActive: true,
          },
        });
        break;

      case 'alert':
        result = await prisma.travelAlert.create({
          data: {
            tripId: id,
            type: data.type,
            severity: data.severity || 'warning',
            title: data.title,
            message: data.message,
            source: data.source,
            affectedItem: data.affectedItem,
            actionRequired: data.actionRequired,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Emergency POST error:', error);
    return NextResponse.json({ error: 'Failed to create emergency data' }, { status: 500 });
  }
}

// PATCH /api/trips/[id]/emergency - Update emergency data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { type, itemId, data } = body;

    let result: any;

    switch (type) {
      case 'contact':
        result = await prisma.emergencyContact.update({
          where: { id: itemId },
          data,
        });
        break;

      case 'safety':
        result = await prisma.safetyInfo.update({
          where: { id: itemId },
          data,
        });
        break;

      case 'alert':
        result = await prisma.travelAlert.update({
          where: { id: itemId },
          data,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Emergency PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update emergency data' }, { status: 500 });
  }
}

// DELETE /api/trips/[id]/emergency - Delete emergency data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');

    if (!type || !itemId) {
      return NextResponse.json({ error: 'Type and itemId required' }, { status: 400 });
    }

    switch (type) {
      case 'contact':
        await prisma.emergencyContact.delete({ where: { id: itemId } });
        break;
      case 'safety':
        await prisma.safetyInfo.delete({ where: { id: itemId } });
        break;
      case 'alert':
        await prisma.travelAlert.delete({ where: { id: itemId } });
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Emergency DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete emergency data' }, { status: 500 });
  }
}
