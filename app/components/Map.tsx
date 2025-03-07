'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from '../hooks/useMap';

type MapProps = {
  center?: [number, number];
  zoom?: number;
  onRouteChange?: (
    coordinates: { latitude: number; longitude: number }[]
  ) => void;
};

const Map = ({
  center = [51.505, -0.09], // Default to London
  zoom = 13,
  onRouteChange,
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const {
    coordinates,
    addCoordinate,
    clearCoordinates,
    distance,
    isDrawing,
    setIsDrawing,
  } = useMap();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create polyline for route
    const polyline = L.polyline([], { color: 'blue', weight: 5 }).addTo(map);
    polylineRef.current = polyline;

    // Add click handler for drawing routes
    map.on('click', (e) => {
      if (!isDrawing) return;

      const { lat, lng } = e.latlng;
      addCoordinate(lat, lng);

      // Add marker at clicked position
      const marker = L.marker([lat, lng]).addTo(map);
      markersRef.current.push(marker);
    });

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      markersRef.current = [];
    };
  }, [center, zoom, addCoordinate, isDrawing]);

  // Update polyline when coordinates change
  useEffect(() => {
    if (!mapRef.current || !polylineRef.current) return;

    // Convert coordinates to LatLng array for Leaflet
    const latLngs = coordinates.map((coord) =>
      L.latLng(coord.latitude, coord.longitude)
    );

    // Update polyline
    polylineRef.current.setLatLngs(latLngs);

    // Notify parent component of route change
    if (onRouteChange) {
      onRouteChange(coordinates);
    }
  }, [coordinates, onRouteChange]);

  // Clear route function
  const handleClearRoute = () => {
    if (!mapRef.current || !polylineRef.current) return;

    // Clear polyline
    polylineRef.current.setLatLngs([]);

    // Remove all markers
    markersRef.current.forEach((marker) => {
      if (mapRef.current) marker.removeFrom(mapRef.current);
    });
    markersRef.current = [];

    // Clear coordinates
    clearCoordinates();
  };

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setIsDrawing(!isDrawing);
  };

  return (
    <div className='relative w-full h-[600px] rounded-lg overflow-hidden'>
      <div ref={mapContainerRef} className='w-full h-full' />

      {/* Map controls */}
      <div className='absolute top-4 right-4 z-[1000] flex flex-col gap-2'>
        <button
          onClick={toggleDrawingMode}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isDrawing
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
        </button>

        <button
          onClick={handleClearRoute}
          className='px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md font-medium'
        >
          Clear Route
        </button>
      </div>

      {/* Distance display */}
      {distance > 0 && (
        <div className='absolute bottom-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-md'>
          <p className='font-medium'>Distance: {distance.toFixed(2)} km</p>
        </div>
      )}
    </div>
  );
};

export default Map;
