import { NextResponse } from 'next/server';

// Mock data for training locations
const mockLocations = [
  {
    id: '1',
    name: 'Central Park',
    description: 'Popular running spot with various trails',
    latitude: 40.785091,
    longitude: -73.968285,
    address: 'New York, NY',
    type: 'Park',
  },
  {
    id: '2',
    name: 'Riverside Track',
    description: 'Running track with river views',
    latitude: 40.801826,
    longitude: -73.972204,
    address: '125 Riverside Dr, New York, NY',
    type: 'Track',
  },
  {
    id: '3',
    name: 'City Gym',
    description: 'Indoor training facility with treadmills',
    latitude: 40.758896,
    longitude: -73.98513,
    address: '123 Main St, New York, NY',
    type: 'Gym',
  },
  {
    id: '4',
    name: 'Mountain Trail',
    description: 'Challenging trail with elevation',
    latitude: 40.796253,
    longitude: -73.949231,
    address: 'Upstate, NY',
    type: 'Trail',
  },
  {
    id: '5',
    name: 'Beach Run',
    description: 'Scenic beach route for running',
    latitude: 40.73061,
    longitude: -73.935242,
    address: 'Long Island, NY',
    type: 'Beach',
  },
];

// GET /api/locations
export async function GET() {
  try {
    // Return mock data instead of fetching from database
    return NextResponse.json(mockLocations);
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

    // In a real app, you would save this to a database
    // For now, we'll just return the data as if it was saved
    const newLocation = {
      id: String(Date.now()), // Generate a unique ID
      name,
      description: body.description || '',
      latitude,
      longitude,
      address: body.address || '',
      type,
    };

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
