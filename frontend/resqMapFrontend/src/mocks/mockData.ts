import { Hazard, Route } from '../types';

export const mockHazards: Hazard[] = [
  {
    id: '1',
    type: 'flood',
    lat: 37.7575,
    lng: -122.4376,
    severity: 'high',
    description: 'Major flooding across multiple streets',
    timestamp: '2025-05-17T09:00:00Z',
    reportedBy: {
      id: 'user1',
      role: 'police'
    }
  },
  {
    id: '2',
    type: 'fire',
    lat: 37.7749,
    lng: -122.4194,
    severity: 'high',
    description: 'Active fire with road closures',
    timestamp: '2025-05-17T10:00:00Z',
    reportedBy: {
      id: 'user2',
      role: 'fire'
    }
  },
  {
    id: '3',
    type: 'collapse',
    lat: 37.7833,
    lng: -122.4167,
    severity: 'medium',
    description: 'Structural damage to bridge',
    timestamp: '2025-05-17T11:00:00Z',
    reportedBy: {
      id: 'user3',
      role: 'rescue'
    }
  },
  {
    id: '4',
    type: 'other',
    lat: 37.7800,
    lng: -122.4300,
    severity: 'low',
    description: 'Temporary road closure due to debris',
    timestamp: '2025-05-17T12:00:00Z',
    reportedBy: {
      id: 'user4',
      role: 'ambulance'
    }
  },
  {
    id: '5',
    type: 'other',
    lat: 37.7900,
    lng: -122.4000,
    severity: 'medium',
    description: 'Area experiencing power outage, traffic lights affected',
    timestamp: '2025-05-17T13:00:00Z',
    reportedBy: {
      id: 'user5',
      role: 'police'
    }
  }
];

// `generateMockRoute()` stays unchanged as long as it only reads `lat/lng` and not `location`
