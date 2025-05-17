import React, { useState, useEffect } from 'react';
import RoutingForm from '../components/panels/RoutingForm';
import MapView from '../components/panels/MapView';
import { Location, RouteOptions, Route } from '../types';

const Dashboard: React.FC = () => {
  const [route, setRoute] = useState<Route | null>(null);
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch hazards on component mount
  useEffect(() => {
    fetchHazards();
  }, []);

  // Fetch hazards from API
  const fetchHazards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/hazards');
      if (!response.ok) {
        throw new Error('Failed to fetch hazards');
      }
      const data = await response.json();
      setHazards(data);
    } catch (err) {
      console.error('Error fetching hazards:', err);
      // Set default mock hazards if API fails
      setHazards([
        {
          id: 'h1',
          type: 'flood',
          severity: 'high',
          lat: 19.072,
          lng: 72.877,
          description: 'Road flooded, impassable',
          timestamp: '2025-05-16T08:30:00Z'
        },
        {
          id: 'h2',
          type: 'debris',
          severity: 'medium',
          lat: 18.551,
          lng: 73.855,
          description: 'Fallen trees blocking partial road',
          timestamp: '2025-05-16T10:15:00Z'
        }
      ]);
    }
  };

  // Generate route with API
  const handleRouteGenerate = async (source: Location, destination: Location, options: RouteOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: source,
          destination: destination,
          travelMode: options.travelMode,
          avoid: Object.entries(options.avoidOptions)
            .filter(([_, value]) => value)
            .map(([key]) => key),
          mode: options.mode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate route');
      }
      
      const routeData = await response.json();
      
      // Transform API response to match our Route type
      const newRoute: Route = {
        waypoints: routeData.route.waypoints,
        distance: routeData.route.distance,
        duration: routeData.route.duration,
        polyline: routeData.route.polyline || '',
        steps: routeData.route.steps || [],
        metadata: {
          algorithm: routeData.metadata.algorithm,
          travelMode: routeData.metadata.travelMode,
          avoidOptions: options.avoidOptions
        }
      };
      
      setRoute(newRoute);
      
    } catch (err: any) {
      console.error('Error generating route:', err);
      setError(err.message || 'Failed to generate route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row p-4 gap-4 h-full">
      <div className="w-full md:w-96 flex-shrink-0 overflow-y-auto">
        <RoutingForm 
          onRouteGenerate={handleRouteGenerate} 
          className="sticky top-0"
        />
        
        {/* Show loading and error states */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            Computing optimal route...
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Route Info Panel */}
        {route && !loading && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow-md border border-neutral-200">
            <h3 className="font-semibold mb-2">Route Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium">{(route.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{Math.round(route.duration / 60)} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Algorithm:</span>
                <span className="font-medium">{route.metadata?.algorithm === 'astar' ? 'A* Search' : 'ML Prediction'}</span>
              </div>
              <div className="flex justify-between">
                <span>Travel Mode:</span>
                <span className="font-medium capitalize">{route.metadata?.travelMode}</span>
              </div>
            </div>
            
            {/* Waypoints count */}
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="flex justify-between text-sm">
                <span>Waypoints:</span>
                <span className="font-medium">{route.waypoints.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-h-[400px] md:min-h-0">
        <MapView 
          route={route} 
          hazards={hazards} 
          className="h-full"
        />
      </div>
    </div>
  );
};

export default Dashboard;