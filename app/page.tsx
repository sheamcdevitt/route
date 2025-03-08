'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PaceCalculator from './components/PaceCalculator';
import NearbyLocations from './components/NearbyLocations';
import RouteSuggestions from './components/RouteSuggestions';
import { calculateRouteDistance } from './utils/routeCalculations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card';

// Dynamically import the Map component to avoid SSR issues with Google Maps
const GoogleMap = dynamic(() => import('./components/GoogleMap'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[600px] bg-muted rounded-lg flex items-center justify-center'>
      <p className='text-muted-foreground'>Loading Map...</p>
    </div>
  ),
});

export default function Home() {
  const [userLocation, setUserLocation] = useState<
    [number, number] | undefined
  >(undefined);
  const [distance, setDistance] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Handle route change from Map component
  const handleRouteChange = (
    coordinates: { latitude: number; longitude: number }[]
  ) => {
    // Calculate the distance based on the coordinates
    const calculatedDistance = calculateRouteDistance(coordinates);
    setDistance(calculatedDistance);
    setRouteCoordinates(coordinates);
  };

  // Handle selecting a suggested route
  const handleSelectRoute = (
    waypoints: { latitude: number; longitude: number }[]
  ) => {
    setRouteCoordinates(waypoints);
    // The distance will be updated by the map component when it renders the route
  };

  return (
    <div className='min-h-screen bg-background'>
      <header className='bg-primary text-primary-foreground p-4'>
        <div className='container mx-auto'>
          <h1 className='text-3xl font-bold'>Route Runner</h1>
          <p className='text-primary-foreground/80'>
            Find and create running routes, calculate pace, and discover nearby
            training locations
          </p>
        </div>
      </header>

      <main className='container mx-auto py-8 px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Map Section */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Create Your Route</CardTitle>
                <CardDescription>
                  Click on the map to create a running route or use the route
                  suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleMap
                  center={userLocation}
                  zoom={13}
                  onRouteChange={handleRouteChange}
                  initialCoordinates={
                    routeCoordinates.length > 0 ? routeCoordinates : undefined
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-8'>
            {/* Route Suggestions */}
            <RouteSuggestions
              userLocation={userLocation}
              onSelectRoute={handleSelectRoute}
            />

            {/* Pace Calculator */}
            <PaceCalculator distance={distance} />

            {/* Nearby Locations */}
            <NearbyLocations userLocation={userLocation} />
          </div>
        </div>
      </main>

      <footer className='bg-muted text-muted-foreground p-4 mt-8'>
        <div className='container mx-auto text-center'>
          <p>
            &copy; {new Date().getFullYear()} Route Runner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
