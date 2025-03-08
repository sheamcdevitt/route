import { useJsApiLoader } from '@react-google-maps/api';

// Define the libraries we need
const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

// Create a shared hook for loading the Google Maps API
export const useGoogleMapsApi = () => {
  return useJsApiLoader({
    id: 'google-maps-api-loader',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
};
