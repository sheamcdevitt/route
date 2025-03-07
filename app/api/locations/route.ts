import prisma from '@/app/lib/db';
import { NextResponse } from 'next/server';

// GET /api/locations
export async function GET() {
  try {
    // Fetch locations from the database
    const locations = await prisma.trainingLocation.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// POST /api/locations
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const { name, latitude, longitude, type } = body;

    if (!name || latitude === undefined || longitude === undefined || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new location
    const location = await prisma.trainingLocation.create({
      data: {
        name,
        description: body.description,
        latitude,
        longitude,
        address: body.address,
        type,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
