import { NextResponse } from 'next/server';

type Coordinate = {
  latitude: number;
  longitude: number;
};

// Mock data for routes
const mockRoutes = [
  {
    id: '1',
    name: 'Morning Park Loop',
    description: 'A scenic route through the park',
    distance: 5.2,
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coordinates: [
      { id: '1', latitude: 40.785091, longitude: -73.968285, order: 0 },
      { id: '2', latitude: 40.790091, longitude: -73.973285, order: 1 },
      { id: '3', latitude: 40.795091, longitude: -73.978285, order: 2 },
      { id: '4', latitude: 40.785091, longitude: -73.968285, order: 3 },
    ],
  },
  {
    id: '2',
    name: 'Riverside Run',
    description: 'Run along the river with great views',
    distance: 3.8,
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coordinates: [
      { id: '5', latitude: 40.801826, longitude: -73.972204, order: 0 },
      { id: '6', latitude: 40.806826, longitude: -73.977204, order: 1 },
      { id: '7', latitude: 40.811826, longitude: -73.982204, order: 2 },
      { id: '8', latitude: 40.801826, longitude: -73.972204, order: 3 },
    ],
  },
];

// GET /api/routes
export async function GET() {
  try {
    // Return mock data instead of fetching from database
    return NextResponse.json(mockRoutes);
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

    // In a real app, you would save this to a database
    // For now, we'll just return the data as if it was saved
    const newRoute = {
      id: String(Date.now()),
      name,
      description: body.description || '',
      distance,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coordinates: coordinates.map((coord: Coordinate, index: number) => ({
        id: `coord-${Date.now()}-${index}`,
        latitude: coord.latitude,
        longitude: coord.longitude,
        order: index,
      })),
    };

    return NextResponse.json(newRoute, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    );
  }
}
