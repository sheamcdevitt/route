'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Loader2 } from 'lucide-react';
import { useGoogleMapsApi } from '../utils/googleMapsLoader';

type RouteSuggestionsProps = {
  userLocation?: [number, number];
  onSelectRoute: (waypoints: { latitude: number; longitude: number }[]) => void;
};

const RouteSuggestions = ({
  userLocation,
  onSelectRoute,
}: RouteSuggestionsProps) => {
  const [desiredDistance, setDesiredDistance] = useState<number>(5); // Default 5km
  const [distanceRange, setDistanceRange] = useState<number>(0.5); // Default ±0.5km
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [suggestedRoutes, setSuggestedRoutes] = useState<
    Array<{
      id: string;
      distance: number;
      waypoints: { latitude: number; longitude: number }[];
      description: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Use the shared Google Maps API loader
  const { isLoaded: isApiLoaded } = useGoogleMapsApi();

  // Generate routes based on the desired distance
  const generateRoutes = async () => {
    if (!userLocation) {
      setError('Location not available. Please enable location services.');
      return;
    }

    if (!isApiLoaded) {
      setError('Google Maps API not loaded. Please try again later.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate 3 different route types
      const routeTypes = [
        { name: 'Loop Route', variation: 0 },
        { name: 'Out and Back', variation: 1 },
        { name: 'Neighborhood Route', variation: 2 },
      ];

      const generatedRoutes = await Promise.all(
        routeTypes.map((type) =>
          generateRealRoute(
            userLocation,
            desiredDistance + (type.variation - 1) * (distanceRange / 2),
            type.name
          )
        )
      );

      // Filter out any failed routes
      const validRoutes = generatedRoutes.filter(
        (route) => route !== null
      ) as Array<{
        id: string;
        distance: number;
        waypoints: { latitude: number; longitude: number }[];
        description: string;
      }>;

      if (validRoutes.length === 0) {
        throw new Error('Could not generate any valid routes');
      }

      setSuggestedRoutes(validRoutes);
    } catch (err) {
      console.error('Error generating routes:', err);
      setError('Failed to generate routes. Please try again.');

      // Fall back to mock routes if real route generation fails
      const mockRoutes = [
        generateMockRoute(
          userLocation,
          desiredDistance - Math.random() * 0.3,
          'Park Loop'
        ),
        generateMockRoute(userLocation, desiredDistance, 'Neighborhood Route'),
        generateMockRoute(
          userLocation,
          desiredDistance + Math.random() * 0.3,
          'Scenic Path'
        ),
      ];

      setSuggestedRoutes(mockRoutes);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate a real route using Google Maps Routes API
  const generateRealRoute = async (
    center: [number, number],
    targetDistance: number,
    routeType: string
  ) => {
    try {
      const [centerLat, centerLng] = center;

      // Generate waypoints based on route type
      let waypoints: { lat: number; lng: number }[] = [];

      if (routeType === 'Loop Route') {
        // Create a loop route by generating points in a rough circle
        waypoints = generateCircularWaypoints(
          centerLat,
          centerLng,
          targetDistance
        );
      } else if (routeType === 'Out and Back') {
        // Create an out-and-back route by going in one direction and returning
        waypoints = generateLinearWaypoints(
          centerLat,
          centerLng,
          targetDistance
        );
      } else {
        // Create a more random route
        waypoints = generateRandomWaypoints(
          centerLat,
          centerLng,
          targetDistance
        );
      }

      // Use Google Maps Routes API to get a real route
      // Prepare the request body
      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: centerLat,
              longitude: centerLng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: centerLat,
              longitude: centerLng,
            },
          },
        },
        intermediates: waypoints.map((point) => ({
          location: {
            latLng: {
              latitude: point.lat,
              longitude: point.lng,
            },
          },
        })),
        travelMode: 'WALK',
        routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: 'en-US',
        units: 'METRIC',
      };

      // Make the API request
      const response = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Routes API request failed with status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No routes returned from the API');
      }

      const routeData = data.routes[0];

      // Get the distance in kilometers
      const distanceInMeters = routeData.distanceMeters || 0;
      const distanceInKilometers = distanceInMeters / 1000;

      // Extract all points along the route
      const routePoints: { latitude: number; longitude: number }[] = [];

      // Add starting point
      routePoints.push({
        latitude: centerLat,
        longitude: centerLng,
      });

      // Decode the polyline to get all points
      if (
        routeData.polyline &&
        routeData.polyline.encodedPolyline &&
        window.google &&
        window.google.maps &&
        window.google.maps.geometry
      ) {
        const decodedPath = google.maps.geometry.encoding.decodePath(
          routeData.polyline.encodedPolyline
        );

        // Add all points from the decoded path
        for (const point of decodedPath) {
          routePoints.push({
            latitude: point.lat(),
            longitude: point.lng(),
          });
        }
      }

      return {
        id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        distance: distanceInKilometers,
        waypoints: routePoints,
        description: `A ${distanceInKilometers.toFixed(
          1
        )}km ${routeType} starting from your location`,
      };
    } catch (error) {
      console.error('Error generating real route:', error);
      return null;
    }
  };

  // Helper function to generate circular waypoints
  const generateCircularWaypoints = (
    centerLat: number,
    centerLng: number,
    targetDistance: number
  ) => {
    const waypoints: { lat: number; lng: number }[] = [];

    // Calculate radius based on target distance
    // A very rough approximation: 1km ≈ 0.009 degrees
    const radius = (targetDistance / (2 * Math.PI)) * 0.009;

    // Generate points in a circle
    const numPoints = 4; // Use 4 points to create a rough circle
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const lat = centerLat + Math.sin(angle) * radius;
      const lng = centerLng + Math.cos(angle) * radius;
      waypoints.push({ lat, lng });
    }

    return waypoints;
  };

  // Helper function to generate linear waypoints (out and back)
  const generateLinearWaypoints = (
    centerLat: number,
    centerLng: number,
    targetDistance: number
  ) => {
    // For an out-and-back route, we need to go half the distance in one direction
    const halfDistance = targetDistance / 2;

    // A very rough approximation: 1km ≈ 0.009 degrees
    const distance = halfDistance * 0.009;

    // Pick a random direction (angle)
    const angle = Math.random() * 2 * Math.PI;

    // Calculate the destination point
    const destLat = centerLat + Math.sin(angle) * distance;
    const destLng = centerLng + Math.cos(angle) * distance;

    // For out-and-back, we just need one waypoint (the turnaround point)
    return [{ lat: destLat, lng: destLng }];
  };

  // Helper function to generate random waypoints
  const generateRandomWaypoints = (
    centerLat: number,
    centerLng: number,
    targetDistance: number
  ) => {
    const waypoints: { lat: number; lng: number }[] = [];

    // Calculate how many points we need based on the distance
    // Assuming each point is roughly 1km apart
    const numPoints = Math.max(2, Math.floor(targetDistance / 1));

    // A very rough approximation: 1km ≈ 0.009 degrees
    const maxDistance = 0.009;

    // Generate random points within a reasonable distance
    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * maxDistance;

      const lat = centerLat + Math.sin(angle) * distance;
      const lng = centerLng + Math.cos(angle) * distance;

      waypoints.push({ lat, lng });
    }

    return waypoints;
  };

  // Helper function to generate a mock route (fallback)
  const generateMockRoute = (
    center: [number, number],
    targetDistance: number,
    routeType: string
  ) => {
    const [centerLat, centerLng] = center;

    // Generate a random route with approximately the target distance
    // This is a simplified version - in reality, you'd use a routing algorithm

    // Start at the user's location
    const waypoints = [{ latitude: centerLat, longitude: centerLng }];

    // Calculate how many points we need based on the distance
    // Assuming each point is roughly 0.5km apart
    const numPoints = Math.max(3, Math.floor(targetDistance / 0.5));

    // Generate a route that roughly forms a circle/polygon around the starting point
    for (let i = 1; i < numPoints; i++) {
      // Calculate angle for this point (to form a rough circle)
      const angle = (i / numPoints) * 2 * Math.PI;

      // Distance from center (in degrees) - very rough approximation
      // 0.01 degrees is approximately 1.11km at the equator
      const distance = (targetDistance / (2 * Math.PI)) * 0.01;

      // Calculate new point
      const lat = centerLat + Math.sin(angle) * distance;
      const lng = centerLng + Math.cos(angle) * distance;

      waypoints.push({ latitude: lat, longitude: lng });
    }

    // Close the loop by returning to start
    waypoints.push({ latitude: centerLat, longitude: centerLng });

    // Calculate actual distance (this would be more accurate in a real implementation)
    const actualDistance = targetDistance;

    return {
      id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      distance: actualDistance,
      waypoints,
      description: `A ${actualDistance.toFixed(
        1
      )}km ${routeType} starting from your location`,
    };
  };

  // Handle selecting a route
  const handleSelectRoute = (route: {
    waypoints: { latitude: number; longitude: number }[];
  }) => {
    onSelectRoute(route.waypoints);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Running Routes</CardTitle>
        <CardDescription>
          Enter your desired distance to get route suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label htmlFor='distance' className='text-sm font-medium'>
                Distance (km)
              </label>
              <span className='text-sm text-muted-foreground'>
                {desiredDistance.toFixed(1)} km
              </span>
            </div>
            <Slider
              id='distance'
              min={1}
              max={20}
              step={0.5}
              value={[desiredDistance]}
              onValueChange={(value) => setDesiredDistance(value[0])}
            />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <label htmlFor='range' className='text-sm font-medium'>
                Distance Range (±km)
              </label>
              <span className='text-sm text-muted-foreground'>
                ±{distanceRange.toFixed(1)} km
              </span>
            </div>
            <Slider
              id='range'
              min={0.1}
              max={2}
              step={0.1}
              value={[distanceRange]}
              onValueChange={(value) => setDistanceRange(value[0])}
            />
          </div>

          <Button
            onClick={generateRoutes}
            className='w-full'
            disabled={isGenerating || !userLocation || !isApiLoaded}
          >
            {isGenerating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Generating Routes...
              </>
            ) : (
              'Generate Routes'
            )}
          </Button>

          {error && <p className='text-sm text-destructive'>{error}</p>}

          {suggestedRoutes.length > 0 && (
            <div className='mt-4 space-y-3'>
              <h3 className='font-medium'>Suggested Routes</h3>
              {suggestedRoutes.map((route) => (
                <div
                  key={route.id}
                  className='border rounded-md p-3 hover:bg-accent cursor-pointer'
                  onClick={() => handleSelectRoute(route)}
                >
                  <div className='flex justify-between items-center'>
                    <div>
                      <p className='font-medium'>
                        {route.distance.toFixed(1)} km
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {route.description}
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteSuggestions;
