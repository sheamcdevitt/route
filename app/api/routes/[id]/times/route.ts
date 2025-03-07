import prisma from '@/app/lib/db';
import { NextResponse } from 'next/server';

type RouteParams = {
  params: {
    id: string;
  };
};

// GET /api/routes/[id]/times
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Fetch route times
    const times = await prisma.routeTime.findMany({
      where: {
        routeId: id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(times);
  } catch (error) {
    console.error('Error fetching route times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route times' },
      { status: 500 }
    );
  }
}

// POST /api/routes/[id]/times
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    const { time } = body;

    if (time === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Calculate pace
    const pace = route.distance > 0 ? time / 60 / route.distance : null;

    // Create new route time
    const routeTime = await prisma.routeTime.create({
      data: {
        routeId: id,
        time,
        pace,
        date: body.date || new Date(),
      },
    });

    return NextResponse.json(routeTime, { status: 201 });
  } catch (error) {
    console.error('Error creating route time:', error);
    return NextResponse.json(
      { error: 'Failed to create route time' },
      { status: 500 }
    );
  }
}
