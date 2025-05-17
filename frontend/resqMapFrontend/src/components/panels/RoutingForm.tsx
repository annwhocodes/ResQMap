import React, { useState } from 'react';
import { Location, RouteOptions } from '../../types';
import Button from '../common/Button';
import Toggle from '../common/Toggle';
import { Navigation, AlertTriangle, Car, Bike, User } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface RoutingFormProps {
  onRouteGenerate: (source: Location, destination: Location, options: RouteOptions) => void;
  className?: string;
}

const RoutingForm: React.FC<RoutingFormProps> = ({ onRouteGenerate, className }) => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceCoords, setSourceCoords] = useState<Location | null>(null);
  const [destCoords, setDestCoords] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Routing options
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [avoidOptions, setAvoidOptions] = useState({
    tolls: false,
    highways: false,
    floods: true,
    debris: true
  });
  const [routeMode, setRouteMode] = useState<'astar' | 'ml'>('astar');
  
  // Geocode results
  const [sourceResults, setSourceResults] = useState<any[]>([]);
  const [destResults, setDestResults] = useState<any[]>([]);
  
  // Debounced search terms
  const debouncedSource = useDebounce(source, 500);
  const debouncedDest = useDebounce(destination, 500);
  
  // Geocode API call
  const geocodeLocation = async (query: string): Promise<any> => {
    try {
      const response = await fetch(`http://localhost:5000/api/geocode?location=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      return await response.json();
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Make sure we have coordinates
      let start = sourceCoords;
      let end = destCoords;
      
      if (!start && source) {
        const result = await geocodeLocation(source);
        if (result && !result.error) {
          start = { lat: result.lat, lng: result.lng };
          setSourceCoords(start);
        } else {
          throw new Error(`Could not find location: ${source}`);
        }
      }
      
      if (!end && destination) {
        const result = await geocodeLocation(destination);
        if (result && !result.error) {
          end = { lat: result.lat, lng: result.lng };
          setDestCoords(end);
        } else {
          throw new Error(`Could not find location: ${destination}`);
        }
      }
      
      if (!start || !end) {
        throw new Error('Please provide both source and destination locations');
      }
      
      // Prepare options
      const options: RouteOptions = {
        travelMode,
        avoidOptions: {
          ...avoidOptions
        },
        mode: routeMode
      };
      
      // Call the API to generate route
      const response = await fetch('http://localhost:5000/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: start,
          destination: end,
          travelMode,
          avoid: Object.entries(avoidOptions)
            .filter(([_, value]) => value)
            .map(([key]) => key),
          mode: routeMode
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate route');
      }
      
      const routeData = await response.json();
      
      // Forward the route to parent component
      onRouteGenerate(start, end, options);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Route generation error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle avoidance option
  const toggleAvoid = (option: keyof typeof avoidOptions) => {
    setAvoidOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border border-neutral-200 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Navigation className="h-5 w-5 mr-2 text-primary-600" />
        Emergency Routing
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source and Destination Inputs */}
        <div className="space-y-3">
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-neutral-700 mb-1">
              Starting Location
            </label>
            <input
              type="text"
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Enter starting location"
              className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-neutral-700 mb-1">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination"
              className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>
      
        {/* Travel Mode */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Travel Mode
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTravelMode('driving')}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-1 rounded-md border ${
                travelMode === 'driving'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Driving</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('cycling')}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-1 rounded-md border ${
                travelMode === 'cycling'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              <Bike className="h-4 w-4" />
              <span>Cycling</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('walking')}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-1 rounded-md border ${
                travelMode === 'walking'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Walking</span>
            </button>
          </div>
        </div>
        
        {/* Avoidance Options */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Avoid Hazards
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              label="Tolls"
              checked={avoidOptions.tolls}
              onChange={() => toggleAvoid('tolls')}
            />
            <Toggle
              label="Highways"
              checked={avoidOptions.highways}
              onChange={() => toggleAvoid('highways')}
            />
            <Toggle
              label="Flood Areas"
              checked={avoidOptions.floods}
              onChange={() => toggleAvoid('floods')}
            />
            <Toggle
              label="Debris/Blockages"
              checked={avoidOptions.debris}
              onChange={() => toggleAvoid('debris')}
            />
          </div>
        </div>
        
        {/* Routing Algorithm */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Routing Algorithm
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRouteMode('astar')}
              className={`flex-1 py-2 px-3 flex items-center justify-center rounded-md border ${
                routeMode === 'astar'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              A* Algorithm
            </button>
            <button
              type="button"
              onClick={() => setRouteMode('ml')}
              className={`flex-1 py-2 px-3 flex items-center justify-center rounded-md border ${
                routeMode === 'ml'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-neutral-300 text-neutral-700'
              }`}
            >
              ML Predictor
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md flex items-start">
            <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Submit Button */}
        <Button
          variant="primary"
          type="submit"
          fullWidth
          disabled={loading}
          loading={loading}
        >
          Generate Best Route
        </Button>
      </form>
    </div>
  );
};

export default RoutingForm;