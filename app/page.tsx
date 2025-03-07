'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PaceCalculator from './components/PaceCalculator';
import NearbyLocations from './components/NearbyLocations';
import { calculateRouteDistance } from './utils/routeCalculations';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-[600px] bg-gray-200 rounded-lg flex items-center justify-center'>
      Loading Map...
    </div>
  ),
});

export default function Home() {
  const [userLocation, setUserLocation] = useState<
    [number, number] | undefined
  >(undefined);
  const [distance, setDistance] = useState<number>(0);

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
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <header className='bg-blue-600 text-white p-4'>
        <div className='container mx-auto'>
          <h1 className='text-3xl font-bold'>Route Runner</h1>
          <p className='text-blue-100'>
            Find and create running routes, calculate pace, and discover nearby
            training locations
          </p>
        </div>
      </header>

      <main className='container mx-auto py-8 px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Map Section */}
          <div className='lg:col-span-2'>
            <h2 className='text-2xl font-bold mb-4'>Create Your Route</h2>
            <Map
              center={userLocation}
              zoom={13}
              onRouteChange={handleRouteChange}
            />
          </div>

          {/* Sidebar */}
          <div className='space-y-8'>
            {/* Pace Calculator */}
            <PaceCalculator distance={distance} />

            {/* Nearby Locations */}
            <NearbyLocations userLocation={userLocation} />
          </div>
        </div>
      </main>

      <footer className='bg-gray-800 text-white p-4 mt-8'>
        <div className='container mx-auto text-center'>
          <p>
            &copy; {new Date().getFullYear()} Route Runner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
