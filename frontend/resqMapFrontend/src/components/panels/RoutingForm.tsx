import React, { useState, useEffect } from 'react';
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
  
  // Reset coordinates when inputs change
  useEffect(() => {
    setSourceCoords(null);
  }, [source]);
  
  useEffect(() => {
    setDestCoords(null);
  }, [destination]);
  
  // Perform geocoding when debounced values change
  useEffect(() => {
    if (debouncedSource && debouncedSource.trim() !== '') {
      geocodeLocation(debouncedSource)
        .then(results => {
          if (results && !results.error) {
            setSourceResults(Array.isArray(results) ? results : [results]);
          } else {
            setSourceResults([]);
          }
        });
    }
  }, [debouncedSource]);
  
  useEffect(() => {
    if (debouncedDest && debouncedDest.trim() !== '') {
      geocodeLocation(debouncedDest)
        .then(results => {
          if (results && !results.error) {
            setDestResults(Array.isArray(results) ? results : [results]);
          } else {
            setDestResults([]);
          }
        });
    }
  }, [debouncedDest]);
  
  // Geocode API call
  const geocodeLocation = async (query: string): Promise<any> => {
    try {
      console.log(`Geocoding: ${query}`);
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
      // Always fresh geocode both locations to get new coordinates
      let start: Location | null = null;
      let end: Location | null = null;
      
      // Get source coordinates
      if (source) {
        const sourceResult = await geocodeLocation(source);
        if (sourceResult && !sourceResult.error) {
          const result = Array.isArray(sourceResult) ? sourceResult[0] : sourceResult;
          start = { lat: result.lat, lng: result.lng };
          setSourceCoords(start);
          console.log('Source coordinates:', start);
        } else {
          throw new Error(`Could not find location: ${source}`);
        }
      } else {
        throw new Error('Please provide a starting location');
      }
      
      // Get destination coordinates
      if (destination) {
        const destResult = await geocodeLocation(destination);
        if (destResult && !destResult.error) {
          const result = Array.isArray(destResult) ? destResult[0] : destResult;
          end = { lat: result.lat, lng: result.lng };
          setDestCoords(end);
          console.log('Destination coordinates:', end);
        } else {
          throw new Error(`Could not find location: ${destination}`);
        }
      } else {
        throw new Error('Please provide a destination');
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
      
      console.log('Generating route with:', { start, end, options });
      
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
            {sourceCoords && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Location found: {sourceCoords.lat.toFixed(6)}, {sourceCoords.lng.toFixed(6)}
              </div>
            )}
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
            {destCoords && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Location found: {destCoords.lat.toFixed(6)}, {destCoords.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      
        {/* Travel Mode */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Travel Mode
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setTravelMode('driving')}
              variant="outline"
              active={travelMode === 'driving'}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-1"
            >
              <Car className={`h-4 w-4 ${travelMode === 'driving' ? 'text-primary-600' : ''}`} />
              <span>Driving</span>
            </Button>
            <Button
              type="button"
              onClick={() => setTravelMode('cycling')}
              variant="outline"
              active={travelMode === 'cycling'}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-1"
            >
              <Bike className={`h-4 w-4 ${travelMode === 'cycling' ? 'text-primary-600' : ''}`} />
              <span>Cycling</span>
            </Button>
            <Button
              type="button"
              onClick={() => setTravelMode('walking')}
              variant="outline"
              active={travelMode === 'walking'}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-1"
            >
              <User className={`h-4 w-4 ${travelMode === 'walking' ? 'text-primary-600' : ''}`} />
              <span>Walking</span>
            </Button>
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
              variant="danger" // Changed to danger (red) when toggled
            />
            <Toggle
              label="Highways"
              checked={avoidOptions.highways}
              onChange={() => toggleAvoid('highways')}
              variant="danger" // Changed to danger (red) when toggled
            />
            <Toggle
              label="Flood Areas"
              checked={avoidOptions.floods}
              onChange={() => toggleAvoid('floods')}
              variant="danger" // Changed to danger (red) when toggled
            />
            <Toggle
              label="Debris/Blockages"
              checked={avoidOptions.debris}
              onChange={() => toggleAvoid('debris')}
              variant="danger" // Changed to danger (red) when toggled
            />
          </div>
        </div>
        
        {/* Routing Algorithm */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Routing Algorithm
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setRouteMode('astar')}
              variant="outline"
              active={routeMode === 'astar'}
              className="flex-1 py-2 px-3 flex items-center justify-center"
            >
              A* Algorithm
            </Button>
            <Button
              type="button"
              onClick={() => setRouteMode('ml')}
              variant="outline"
              active={routeMode === 'ml'}
              className="flex-1 py-2 px-3 flex items-center justify-center"
            >
              ML Predictor
            </Button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md flex items-start">
            <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Submit Button - Fixed styling to make it more visible */}
        <div className="mt-6">
          <Button
            variant="outline"
            type="submit"
            fullWidth
            loading={loading}
            size="lg"
            className="py-3 font-semibold shadow-md text-black bg-primary-400 hover:bg-primary-500 border-primary-500"
          >
            Generate Best Route
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoutingForm;