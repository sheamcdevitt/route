/**
 * Calculates the pace in minutes per kilometer based on time and distance
 * @param timeInSeconds - Total time in seconds
 * @param distanceInKm - Total distance in kilometers
 * @returns Pace in minutes per kilometer
 */
export const calculatePace = (
  timeInSeconds: number,
  distanceInKm: number
): number => {
  if (distanceInKm <= 0) return 0;
  // Convert seconds to minutes and divide by distance
  return timeInSeconds / 60 / distanceInKm;
};

/**
 * Calculates the estimated time based on pace and distance
 * @param paceInMinPerKm - Pace in minutes per kilometer
 * @param distanceInKm - Total distance in kilometers
 * @returns Estimated time in seconds
 */
export const calculateTime = (
  paceInMinPerKm: number,
  distanceInKm: number
): number => {
  // Convert pace to seconds per kilometer and multiply by distance
  return paceInMinPerKm * 60 * distanceInKm;
};

/**
 * Formats time in seconds to a human-readable format (HH:MM:SS)
 * @param timeInSeconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
};

/**
 * Formats pace in minutes per kilometer to a human-readable format (MM:SS/km)
 * @param paceInMinPerKm - Pace in minutes per kilometer
 * @returns Formatted pace string
 */
export const formatPace = (paceInMinPerKm: number): string => {
  const minutes = Math.floor(paceInMinPerKm);
  const seconds = Math.floor((paceInMinPerKm - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Converts degrees to radians
 * @param deg - Degrees
 * @returns Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Calculates the total distance of a route based on its coordinates
 * @param coordinates - Array of coordinates with latitude and longitude
 * @returns Total distance in kilometers
 */
export const calculateRouteDistance = (
  coordinates: { latitude: number; longitude: number }[]
): number => {
  if (coordinates.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const { latitude: lat1, longitude: lon1 } = coordinates[i];
    const { latitude: lat2, longitude: lon2 } = coordinates[i + 1];
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }

  return totalDistance;
};
