import { Hazard, Route } from '../types';

// Mock hazards data
export const mockHazards: Hazard[] = [
  {
    id: '1',
    type: 'flood',
    location: { lat: 37.7575, lng: -122.4376, name: 'Bay Area Flooding' },
    severity: 'high',
    description: 'Major flooding across multiple streets'
  },
  {
    id: '2',
    type: 'fire',
    location: { lat: 37.7749, lng: -122.4194, name: 'Downtown Fire' },
    severity: 'high',
    description: 'Active fire with road closures'
  },
  {
    id: '3',
    type: 'collapse',
    location: { lat: 37.7833, lng: -122.4167, name: 'Bridge Damage' },
    severity: 'medium',
    description: 'Structural damage to bridge'
  },
  {
    id: '4',
    type: 'roadblock',
    location: { lat: 37.7800, lng: -122.4300, name: 'Road Closure' },
    severity: 'low',
    description: 'Temporary road closure due to debris'
  },
  {
    id: '5',
    type: 'other',
    location: { lat: 37.7900, lng: -122.4000, name: 'Power Outage' },
    severity: 'medium',
    description: 'Area experiencing power outage, traffic lights affected'
  }
];

// Mock route data
export const generateMockRoute = (
  source: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  options: { avoidUnsafe: boolean }
): Route => {
  // Generate a few random waypoints between source and destination
  const waypoints = Array.from({ length: 3 }).map((_, index) => {
    const ratio = (index + 1) / 4;
    return {
      lat: source.lat + (destination.lat - source.lat) * ratio,
      lng: source.lng + (destination.lng - source.lng) * ratio,
      name: `Waypoint ${index + 1}`
    };
  });

  // Filter hazards that might be on the route
  const routeHazards = mockHazards.filter(() => Math.random() > 0.5);

  return {
    id: Math.random().toString(36).substring(2, 9),
    source,
    destination,
    waypoints,
    hazards: routeHazards,
    estimatedTime: Math.floor(Math.random() * 60) + 20, // 20-80 minutes
    distance: Math.floor(Math.random() * 50) + 10, // 10-60 km
    isSafe: options.avoidUnsafe ? true : Math.random() > 0.3
  };
};