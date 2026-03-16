import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/trips/[id]/travelers - Get all travelers and group expenses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeExpenses = searchParams.get('includeExpenses') === 'true';

    const travelers = await prisma.traveler.findMany({
      where: { tripId: id },
      orderBy: [{ isMainTraveler: 'desc' }, { name: 'asc' }],
      include: includeExpenses ? { groupExpenses: true } : undefined,
    });

    let groupExpenses: any[] = [];
    let balances: Record<string, number> = {};

    if (includeExpenses) {
      groupExpenses = await prisma.groupExpense.findMany({
        where: { tripId: id },
        include: {
          splits: {
            include: {
              traveler: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      // Calculate balances
      for (const traveler of travelers) {
        balances[traveler.id] = 0;
      }

      for (const expense of groupExpenses) {
        // The payer gets credit for the total amount
        if (balances[expense.paidById] !== undefined) {
          balances[expense.paidById] += expense.totalAmount;
        }

        // Each person's share is deducted
        for (const split of expense.splits) {
          if (balances[split.travelerId] !== undefined) {
            balances[split.travelerId] -= split.shareAmount;
          }
        }
      }
    }

    return NextResponse.json({
      travelers,
      groupExpenses: includeExpenses ? groupExpenses : undefined,
      balances: includeExpenses ? balances : undefined,
    });
  } catch (error) {
    console.error('Travelers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch travelers' }, { status: 500 });
  }
}

// POST /api/trips/[id]/travelers - Add a traveler or group expense
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
      case 'traveler':
        result = await prisma.traveler.create({
          data: {
            tripId: id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            passportNumber: data.passportNumber,
            nationality: data.nationality,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            emergencyContact: data.emergencyContact,
            dietaryRestrictions: data.dietaryRestrictions,
            medicalInfo: data.medicalInfo,
            isMainTraveler: data.isMainTraveler || false,
          },
        });

        // Update trip's numberOfTravelers
        const travelerCount = await prisma.traveler.count({ where: { tripId: id } });
        await prisma.trip.update({
          where: { id },
          data: { numberOfTravelers: travelerCount },
        });
        break;

      case 'expense':
        // Create group expense with splits
        result = await prisma.groupExpense.create({
          data: {
            tripId: id,
            description: data.description,
            totalAmount: data.totalAmount,
            currency: data.currency,
            paidById: data.paidById,
            category: data.category,
            date: new Date(data.date),
            notes: data.notes,
            splits: {
              create: data.splits.map((split: any) => ({
                travelerId: split.travelerId,
                shareAmount: split.shareAmount,
                isPaid: split.isPaid || false,
              })),
            },
          },
          include: {
            splits: {
              include: {
                traveler: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Travelers POST error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PATCH /api/trips/[id]/travelers - Update traveler or expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { type, itemId, data } = body;

    let result: any;

    switch (type) {
      case 'traveler':
        result = await prisma.traveler.update({
          where: { id: itemId },
          data: {
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          },
        });
        break;

      case 'expense':
        result = await prisma.groupExpense.update({
          where: { id: itemId },
          data: {
            ...data,
            date: data.date ? new Date(data.date) : undefined,
          },
        });
        break;

      case 'split':
        result = await prisma.groupExpenseSplit.update({
          where: { id: itemId },
          data,
        });
        break;

      case 'settle':
        // Mark expense as settled
        result = await prisma.groupExpense.update({
          where: { id: itemId },
          data: { isSettled: true },
        });
        // Mark all splits as paid
        await prisma.groupExpenseSplit.updateMany({
          where: { groupExpenseId: itemId },
          data: { isPaid: true },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Travelers PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/trips/[id]/travelers - Delete traveler or expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const itemId = searchParams.get('itemId');

    if (!type || !itemId) {
      return NextResponse.json({ error: 'Type and itemId required' }, { status: 400 });
    }

    switch (type) {
      case 'traveler':
        await prisma.traveler.delete({ where: { id: itemId } });
        // Update trip's numberOfTravelers
        const travelerCount = await prisma.traveler.count({ where: { tripId: id } });
        await prisma.trip.update({
          where: { id },
          data: { numberOfTravelers: Math.max(1, travelerCount) },
        });
        break;

      case 'expense':
        await prisma.groupExpense.delete({ where: { id: itemId } });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Travelers DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
