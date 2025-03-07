'use client';

import { useCallback, useEffect, useState } from 'react';
import { calculateRouteDistance } from '../utils/routeCalculations';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type UseMapReturn = {
  coordinates: Coordinate[];
  addCoordinate: (lat: number, lng: number) => void;
  removeLastCoordinate: () => void;
  clearCoordinates: () => void;
  distance: number;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
};

export const useMap = (): UseMapReturn => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Calculate distance whenever coordinates change
  useEffect(() => {
    const newDistance = calculateRouteDistance(coordinates);
    setDistance(newDistance);
  }, [coordinates]);

  // Add a new coordinate to the route
  const addCoordinate = useCallback((lat: number, lng: number) => {
    setCoordinates((prev) => [...prev, { latitude: lat, longitude: lng }]);
  }, []);

  // Remove the last coordinate from the route
  const removeLastCoordinate = useCallback(() => {
    setCoordinates((prev) => prev.slice(0, -1));
  }, []);

  // Clear all coordinates
  const clearCoordinates = useCallback(() => {
    setCoordinates([]);
  }, []);

  return {
    coordinates,
    addCoordinate,
    removeLastCoordinate,
    clearCoordinates,
    distance,
    isDrawing,
    setIsDrawing,
  };
};
