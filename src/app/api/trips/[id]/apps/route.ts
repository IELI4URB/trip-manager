import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Recommended Apps API
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apps = await prisma.recommendedApp.findMany({
      where: { tripId: params.id },
      orderBy: [{ isInstalled: 'asc' }, { category: 'asc' }],
    });

    return NextResponse.json(apps);
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      const apps = [];
      for (const app of body) {
        const created = await prisma.recommendedApp.create({
          data: { tripId: params.id, ...app },
        });
        apps.push(created);
      }
      return NextResponse.json(apps);
    }

    const app = await prisma.recommendedApp.create({
      data: {
        tripId: params.id,
        ...body,
      },
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error('Failed to create app:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const app = await prisma.recommendedApp.update({
      where: { id },
      data,
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error('Failed to update app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    const app = await prisma.recommendedApp.update({
      where: { id },
      data,
    });

    return NextResponse.json(app);
  } catch (error) {
    console.error('Failed to update app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.recommendedApp.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete app:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
