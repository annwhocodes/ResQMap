import { Hazard } from '../types';

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
};

// Filter hazards within a specific radius
export const filterHazardsByDistance = (
  hazards: Hazard[],
  lat: number,
  lng: number,
  radiusKm: number = 100
): Hazard[] => {
  return hazards
    .map(hazard => {
      const distance = calculateDistance(lat, lng, hazard.lat, hazard.lng);
      return { ...hazard, distance };
    })
    .filter(hazard => (hazard as any).distance <= radiusKm)
    .sort((a, b) => (a as any).distance - (b as any).distance);
};

// Get hazard severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Get hazard type icon name
export const getHazardTypeIcon = (type: string): string => {
  switch (type) {
    case 'flood':
      return 'water';
    case 'fire':
      return 'flame';
    case 'collapse':
      return 'building';
    case 'chemical':
      return 'flask';
    case 'debris':
      return 'trash';
    default:
      return 'alert-circle';
  }
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Generate a random hazard for testing
export const generateMockHazard = (lat: number, lng: number): Hazard => {
  const types = ['flood', 'fire', 'collapse', 'chemical', 'debris', 'other'] as const;
  const severities = ['low', 'medium', 'high'] as const;
  
  return {
    id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: types[Math.floor(Math.random() * types.length)],
    lat: lat + (Math.random() - 0.5) * 0.5, // Add some randomness to location
    lng: lng + (Math.random() - 0.5) * 0.5,
    severity: severities[Math.floor(Math.random() * severities.length)],
    description: 'This is a mock hazard for testing purposes',
    timestamp: new Date().toISOString()
  };
};

// Generate multiple mock hazards around a location
export const generateMockHazardsNearLocation = (
  lat: number, 
  lng: number, 
  count: number = 10
): Hazard[] => {
  const hazards: Hazard[] = [];
  
  for (let i = 0; i < count; i++) {
    hazards.push(generateMockHazard(lat, lng));
  }
  
  return hazards;
};
