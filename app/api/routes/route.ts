import prisma from '@/app/lib/db';
import { NextResponse } from 'next/server';

type Coordinate = {
  latitude: number;
  longitude: number;
};

// GET /api/routes
export async function GET() {
  try {
    // Fetch routes from the database
    const routes = await prisma.route.findMany({
      include: {
        coordinates: {
          orderBy: {
            order: 'asc',
          },
        },
        routeTimes: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

// POST /api/routes
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, distance, coordinates, userId } = body;

    if (
      !name ||
      distance === undefined ||
      !coordinates ||
      !coordinates.length ||
      !userId
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new route with coordinates
    const route = await prisma.route.create({
      data: {
        name,
        description: body.description,
        distance,
        userId,
        coordinates: {
          create: coordinates.map((coord: Coordinate, index: number) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
            order: index,
          })),
        },
      },
      include: {
        coordinates: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    );
  }
}
