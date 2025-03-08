'use client';

import { useState, useEffect } from 'react';
import { calculateDistance } from '../utils/routeCalculations';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

type TrainingLocation = {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  type: string;
  distance?: number; // Distance from current location
};

type NearbyLocationsProps = {
  userLocation?: [number, number]; // [latitude, longitude]
  maxDistance?: number; // in kilometers
};

const NearbyLocations = ({
  userLocation,
  maxDistance = 10, // Default to 10km
}: NearbyLocationsProps) => {
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);

        // In a real app, this would be an API call to fetch locations from the database
        // For now, we'll use mock data
        const response = await fetch('/api/locations');

        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }

        const data = await response.json();
        setLocations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load nearby locations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Calculate distance from user location and filter by max distance
  const nearbyLocations = userLocation
    ? locations
        .map((location) => ({
          ...location,
          distance: calculateDistance(
            userLocation[0],
            userLocation[1],
            location.latitude,
            location.longitude
          ),
        }))
        .filter((location) => (location.distance || 0) <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    : locations;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearby Training Locations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className='text-muted-foreground'>Loading locations...</p>
        ) : error ? (
          <p className='text-destructive'>{error}</p>
        ) : nearbyLocations.length > 0 ? (
          <div className='space-y-4'>
            {nearbyLocations.map((location) => (
              <div key={location.id} className='border-b pb-4'>
                <h3 className='text-lg font-medium'>{location.name}</h3>
                {location.description && (
                  <p className='text-muted-foreground mt-1'>
                    {location.description}
                  </p>
                )}
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Badge variant='secondary'>{location.type}</Badge>
                  {location.distance !== undefined && (
                    <Badge variant='outline'>
                      {location.distance.toFixed(2)} km away
                    </Badge>
                  )}
                </div>
                {location.address && (
                  <p className='text-muted-foreground text-sm mt-1'>
                    {location.address}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground'>
            {userLocation
              ? 'No training locations found nearby.'
              : 'Share your location to find nearby training spots.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbyLocations;
