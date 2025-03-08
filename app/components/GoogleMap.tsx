'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleMap,
  Marker,
  Polyline,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { calculateRouteDistance } from '../utils/routeCalculations';
import { useGoogleMapsApi } from '../utils/googleMapsLoader';

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 51.505,
  lng: -0.09, // Default to London
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
  ],
};

type MapProps = {
  center?: [number, number];
  zoom?: number;
  onRouteChange?: (
    coordinates: { latitude: number; longitude: number }[]
  ) => void;
  initialCoordinates?: { latitude: number; longitude: number }[];
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

const Map = ({
  center,
  zoom = 13,
  onRouteChange,
  initialCoordinates,
}: MapProps) => {
  const { isLoaded } = useGoogleMapsApi();

  const [coordinates, setCoordinates] = useState<Coordinate[]>(
    initialCoordinates || []
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [distance, setDistance] = useState(0);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isUsingRealRoutes, setIsUsingRealRoutes] = useState(true);
  const [customPolylinePath, setCustomPolylinePath] = useState<
    Array<{ lat: number; lng: number }>
  >([]);
  const [useCustomPolyline, setUseCustomPolyline] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Convert center prop to Google Maps format
  const mapCenter = center ? { lat: center[0], lng: center[1] } : defaultCenter;

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Add coordinate to route
  const addCoordinate = useCallback((lat: number, lng: number) => {
    setCoordinates((prev) => [...prev, { latitude: lat, longitude: lng }]);
  }, []);

  // Clear all coordinates
  const clearCoordinates = useCallback(() => {
    setCoordinates([]);
    setDirections(null);
    setDistance(0);
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      addCoordinate(lat, lng);
    },
    [isDrawing, addCoordinate]
  );

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setIsDrawing(!isDrawing);
  };

  // Clear route
  const handleClearRoute = () => {
    clearCoordinates();
  };

  // Helper function to check if we have access to the Routes API
  const checkRoutesApiAccess = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        if (!window.google || !window.google.maps) {
          resolve(false);
          return;
        }

        // Try to access the Routes API
        fetch(
          `https://routes.googleapis.com/directions/v2:computeRoutes?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
            },
            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude: 0,
                    longitude: 0,
                  },
                },
              },
              destination: {
                location: {
                  latLng: {
                    latitude: 0.001,
                    longitude: 0.001,
                  },
                },
              },
              travelMode: 'WALK',
            }),
          }
        )
          .then((response) => {
            if (response.ok) {
              resolve(true);
            } else {
              console.warn('Routes API access check failed:', response.status);
              resolve(false);
            }
          })
          .catch((error) => {
            console.error('Error checking Routes API access:', error);
            resolve(false);
          });
      } catch (error) {
        console.error('Error checking Routes API access:', error);
        resolve(false);
      }
    });
  };

  // Calculate real route when coordinates change
  useEffect(() => {
    const calculateRoute = async () => {
      if (coordinates.length < 2) {
        setDirections(null);
        setDistance(0);
        setIsUsingRealRoutes(true);
        setUseCustomPolyline(false);
        setCustomPolylinePath([]);
        return;
      }

      setIsCalculatingRoute(true);

      try {
        // Check if we have the necessary API permissions
        const hasRoutesApiAccess = await checkRoutesApiAccess();

        // If we don't have access to the Routes API, fall back to straight-line distance
        if (!hasRoutesApiAccess) {
          console.warn(
            'Routes API not available - using straight-line distance instead'
          );
          const straightLineDistance = calculateRouteDistance(coordinates);
          setDistance(straightLineDistance);
          setIsUsingRealRoutes(false);
          setDirections(null);
          setUseCustomPolyline(true);
          setCustomPolylinePath(
            coordinates.map((coord) => ({
              lat: coord.latitude,
              lng: coord.longitude,
            }))
          );

          if (onRouteChange) {
            onRouteChange(coordinates);
          }

          setIsCalculatingRoute(false);
          return;
        }

        // Use the Routes API
        try {
          // Prepare the request body
          const requestBody = {
            origin: {
              location: {
                latLng: {
                  latitude: coordinates[0].latitude,
                  longitude: coordinates[0].longitude,
                },
              },
            },
            destination: {
              location: {
                latLng: {
                  latitude: coordinates[coordinates.length - 1].latitude,
                  longitude: coordinates[coordinates.length - 1].longitude,
                },
              },
            },
            intermediates: coordinates.slice(1, -1).map((coord) => ({
              location: {
                latLng: {
                  latitude: coord.latitude,
                  longitude: coord.longitude,
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

          if (response.ok) {
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];

              // Get the distance in kilometers
              const distanceInMeters = route.distanceMeters || 0;
              const distanceInKm = distanceInMeters / 1000;

              setDistance(distanceInKm);
              setIsUsingRealRoutes(true);

              // Decode the polyline and create a custom polyline
              if (route.polyline && route.polyline.encodedPolyline) {
                // Clear any existing directions
                setDirections(null);

                // Use the Google Maps geometry library to decode the polyline
                if (
                  window.google &&
                  window.google.maps &&
                  window.google.maps.geometry
                ) {
                  const decodedPath = google.maps.geometry.encoding.decodePath(
                    route.polyline.encodedPolyline
                  );

                  // Convert the decoded path to a format suitable for our custom polyline
                  const pathArray = decodedPath.map((point) => ({
                    lat: point.lat(),
                    lng: point.lng(),
                  }));

                  setUseCustomPolyline(true);
                  setCustomPolylinePath(pathArray);
                } else {
                  // If the geometry library isn't available, fall back to straight lines
                  setUseCustomPolyline(true);
                  setCustomPolylinePath(
                    coordinates.map((coord) => ({
                      lat: coord.latitude,
                      lng: coord.longitude,
                    }))
                  );
                }
              }

              // Notify parent component of route change
              if (onRouteChange) {
                onRouteChange(coordinates);
              }
            } else {
              throw new Error('No routes returned from the API');
            }
          } else {
            throw new Error(
              `Routes API request failed with status: ${response.status}`
            );
          }

          setIsCalculatingRoute(false);
        } catch (error) {
          console.error('Error using Routes API:', error);

          // Fall back to straight-line distance
          console.warn('Falling back to straight-line distance...');
          const straightLineDistance = calculateRouteDistance(coordinates);
          setDistance(straightLineDistance);
          setIsUsingRealRoutes(false);
          setDirections(null);
          setUseCustomPolyline(true);
          setCustomPolylinePath(
            coordinates.map((coord) => ({
              lat: coord.latitude,
              lng: coord.longitude,
            }))
          );

          if (onRouteChange) {
            onRouteChange(coordinates);
          }

          setIsCalculatingRoute(false);
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        // Fall back to straight-line distance if there's an error
        const straightLineDistance = calculateRouteDistance(coordinates);
        setDistance(straightLineDistance);
        setIsUsingRealRoutes(false);
        setDirections(null);
        setUseCustomPolyline(true);
        setCustomPolylinePath(
          coordinates.map((coord) => ({
            lat: coord.latitude,
            lng: coord.longitude,
          }))
        );

        if (onRouteChange) {
          onRouteChange(coordinates);
        }

        setIsCalculatingRoute(false);
      }
    };

    calculateRoute();
  }, [coordinates, onRouteChange]);

  // Initialize with initialCoordinates if provided
  useEffect(() => {
    if (initialCoordinates && initialCoordinates.length > 0) {
      setCoordinates(initialCoordinates);

      // Trigger route calculation for the initial coordinates
      if (initialCoordinates.length >= 2) {
        // We need to wait for the Google Maps API to load
        if (isLoaded && window.google && window.google.maps) {
          // Calculate the route for these coordinates
          const calculateInitialRoute = async () => {
            setIsCalculatingRoute(true);

            try {
              // Use the Routes API to calculate the route
              // Prepare the request body
              const requestBody = {
                origin: {
                  location: {
                    latLng: {
                      latitude: initialCoordinates[0].latitude,
                      longitude: initialCoordinates[0].longitude,
                    },
                  },
                },
                destination: {
                  location: {
                    latLng: {
                      latitude:
                        initialCoordinates[initialCoordinates.length - 1]
                          .latitude,
                      longitude:
                        initialCoordinates[initialCoordinates.length - 1]
                          .longitude,
                    },
                  },
                },
                intermediates: initialCoordinates.slice(1, -1).map((coord) => ({
                  location: {
                    latLng: {
                      latitude: coord.latitude,
                      longitude: coord.longitude,
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

              if (response.ok) {
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                  const route = data.routes[0];

                  // Get the distance in kilometers
                  const distanceInMeters = route.distanceMeters || 0;
                  const distanceInKm = distanceInMeters / 1000;

                  setDistance(distanceInKm);
                  setIsUsingRealRoutes(true);

                  // Decode the polyline and create a custom polyline
                  if (route.polyline && route.polyline.encodedPolyline) {
                    // Clear any existing directions
                    setDirections(null);

                    // Use the Google Maps geometry library to decode the polyline
                    if (
                      window.google &&
                      window.google.maps &&
                      window.google.maps.geometry
                    ) {
                      const decodedPath =
                        google.maps.geometry.encoding.decodePath(
                          route.polyline.encodedPolyline
                        );

                      // Convert the decoded path to a format suitable for our custom polyline
                      const pathArray = decodedPath.map((point) => ({
                        lat: point.lat(),
                        lng: point.lng(),
                      }));

                      setUseCustomPolyline(true);
                      setCustomPolylinePath(pathArray);
                    } else {
                      // If the geometry library isn't available, fall back to straight lines
                      setUseCustomPolyline(true);
                      setCustomPolylinePath(
                        initialCoordinates.map((coord) => ({
                          lat: coord.latitude,
                          lng: coord.longitude,
                        }))
                      );
                    }
                  }

                  // Notify parent component of route change
                  if (onRouteChange) {
                    onRouteChange(initialCoordinates);
                  }
                } else {
                  throw new Error('No routes returned from the API');
                }
              } else {
                throw new Error(
                  `Routes API request failed with status: ${response.status}`
                );
              }
            } catch (error) {
              console.error('Error calculating initial route:', error);
              // Fall back to straight-line distance
              const straightLineDistance =
                calculateRouteDistance(initialCoordinates);
              setDistance(straightLineDistance);
              setIsUsingRealRoutes(false);
              setDirections(null);
              setUseCustomPolyline(true);
              setCustomPolylinePath(
                initialCoordinates.map((coord) => ({
                  lat: coord.latitude,
                  lng: coord.longitude,
                }))
              );

              if (onRouteChange) {
                onRouteChange(initialCoordinates);
              }
            }

            setIsCalculatingRoute(false);
          };

          calculateInitialRoute();
        }
      }
    }
  }, [initialCoordinates, isLoaded, onRouteChange]);

  if (!isLoaded) {
    return (
      <div className='w-full h-[600px] bg-muted rounded-lg flex items-center justify-center'>
        <p className='text-muted-foreground'>Loading Map...</p>
      </div>
    );
  }

  return (
    <div className='relative w-full h-[600px] rounded-lg overflow-hidden'>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {/* Markers for each point in the route */}
        {coordinates.map((coord, index) => (
          <Marker
            key={`marker-${index}`}
            position={{ lat: coord.latitude, lng: coord.longitude }}
            label={
              index === 0
                ? 'S'
                : index === coordinates.length - 1
                ? 'E'
                : `${index}`
            }
          />
        ))}

        {/* DirectionsRenderer for the route */}
        {directions && !useCustomPolyline && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {/* Custom Polyline for when DirectionsRenderer can't be used */}
        {useCustomPolyline && customPolylinePath.length > 1 && (
          <Polyline
            path={customPolylinePath}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 5,
            }}
          />
        )}
      </GoogleMap>

      {/* Map controls */}
      <div className='absolute top-4 right-4 z-[1000] flex flex-col gap-2'>
        <button
          onClick={toggleDrawingMode}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isDrawing
              ? 'bg-destructive hover:bg-destructive/90'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
        </button>

        <button
          onClick={handleClearRoute}
          className='px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md font-medium'
        >
          Clear Route
        </button>
      </div>

      {/* Distance display */}
      {distance > 0 && (
        <div className='absolute bottom-4 left-4 z-[1000] bg-background p-2 rounded-md shadow-md'>
          <p className='font-medium'>
            {isCalculatingRoute ? (
              'Calculating...'
            ) : (
              <>
                Distance: {distance.toFixed(2)} km
                {!isUsingRealRoutes && (
                  <span className='text-xs ml-1 text-muted-foreground'>
                    (straight-line)
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {/* API Information */}
      <div className='absolute bottom-4 right-4 z-[1000] bg-background p-2 rounded-md shadow-md max-w-xs text-xs'>
        <p className='text-muted-foreground'>
          {!isUsingRealRoutes && distance > 0
            ? 'To enable real route calculations, please enable the Routes API in your Google Cloud Console.'
            : 'Using Google Maps Routes API for distance calculation.'}
        </p>
      </div>
    </div>
  );
};

export default Map;
