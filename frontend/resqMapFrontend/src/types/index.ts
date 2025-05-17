export type UserRole = 'ambulance' | 'fire' | 'police' | 'rescue';

// Location type for coordinates
export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

// Waypoint in a route
export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  type?: string;
}

// Route options for configuring path finding
export interface RouteOptions {
  travelMode: 'driving' | 'walking' | 'cycling';
  avoidOptions: {
    tolls?: boolean;
    highways?: boolean;
    floods?: boolean;
    debris?: boolean;
    [key: string]: boolean | undefined;
  };
  mode: 'astar' | 'ml';
}

// Step in navigation directions
export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  maneuver?: string;
}

// Complete route data structure
export interface Route {
  waypoints: Waypoint[];
  distance: number;
  duration: number;
  polyline: string;
  steps: RouteStep[];
  metadata?: {
    algorithm: string;
    travelMode: string;
    avoidOptions: {
      [key: string]: boolean | undefined;
    };
  };
}

// Hazard type for reporting obstacles
export interface Hazard {
  id: string;
  type: 'flood' | 'fire' | 'debris' | 'chemical' | 'collapse' | 'other';
  severity: 'low' | 'medium' | 'high';
  lat: number;
  lng: number;
  description: string;
  timestamp: string;
  reportedBy?: {
    id: string;
    role: UserRole;
  };
}