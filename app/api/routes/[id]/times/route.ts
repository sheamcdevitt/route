import { NextResponse } from 'next/server';

type RouteParams = {
  params: {
    id: string;
  };
};

// Mock data for route times
const mockRouteTimes = {
  '1': [
    {
      id: '1',
      routeId: '1',
      time: 1800, // 30 minutes in seconds
      pace: 5.77, // minutes per km
      date: '2023-06-15T08:30:00Z',
    },
    {
      id: '2',
      routeId: '1',
      time: 1650, // 27.5 minutes in seconds
      pace: 5.29, // minutes per km
      date: '2023-06-20T07:45:00Z',
    },
  ],
  '2': [
    {
      id: '3',
      routeId: '2',
      time: 1200, // 20 minutes in seconds
      pace: 5.26, // minutes per km
      date: '2023-06-18T17:30:00Z',
    },
  ],
};

// Mock routes data for reference
const mockRoutes = {
  '1': {
    id: '1',
    name: 'Morning Park Loop',
    description: 'A scenic route through the park',
    distance: 5.2,
  },
  '2': {
    id: '2',
    name: 'Riverside Run',
    description: 'Run along the river with great views',
    distance: 3.8,
  },
};

// GET /api/routes/[id]/times
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if route exists
    const route = mockRoutes[id as keyof typeof mockRoutes];

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Return mock times for this route
    const times = mockRouteTimes[id as keyof typeof mockRouteTimes] || [];

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
    const route = mockRoutes[id as keyof typeof mockRoutes];

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Calculate pace
    const pace = route.distance > 0 ? time / 60 / route.distance : null;

    // Create new route time (in a real app, this would be saved to a database)
    const newRouteTime = {
      id: String(Date.now()),
      routeId: id,
      time,
      pace,
      date: body.date || new Date().toISOString(),
    };

    // In a real app, we would add this to the database
    // For now, we'll just return it as if it was saved

    return NextResponse.json(newRouteTime, { status: 201 });
  } catch (error) {
    console.error('Error creating route time:', error);
    return NextResponse.json(
      { error: 'Failed to create route time' },
      { status: 500 }
    );
  }
}
