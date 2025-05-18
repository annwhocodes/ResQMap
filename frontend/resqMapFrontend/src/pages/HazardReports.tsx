import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocationSearch, SearchResult } from '../hooks/useLocationSearch';
import HazardService, { Hazard, WeatherData, SafetyScore } from '../services/HazardService';
import LocationInput from '../components/hazards/LocationInput';
import HazardCard from '../components/hazards/HazardCard';
import HazardMap from '../components/hazards/HazardMap';
import WeatherCard from '../components/hazards/WeatherCard';
import SafetyScoreCard from '../components/hazards/SafetyScoreCard';


const HazardReports: React.FC = () => {
  // State for hazards and data
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [safetyScore, setSafetyScore] = useState<SafetyScore | null>(null);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [safetyLoading, setSafetyLoading] = useState<boolean>(false);
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location state
  const [activeLocation, setActiveLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isUsingLiveLocation, setIsUsingLiveLocation] = useState(false);
  
  // Geolocation hook
  const { loading: geoLoading, error: geoError, location: geoLocation, requestGeolocation } = useGeolocation();
  
  // Location search hook
  const { 
    query, 
    results, 
    loading: searchLoading, 
    error: searchError, 
    selectedLocation,
    handleQueryChange, 
    handleSelectLocation, 
    clearSearch 
  } = useLocationSearch();

  // Fetch hazards based on location
  const fetchHazards = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const hazardsData = await HazardService.getHazardsNearLocation(lat, lng, 100);
      setHazards(hazardsData);
    } catch (err) {
      setError('Failed to fetch hazard data. Please try again.');
      console.error('Error fetching hazards:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch weather data
  const fetchWeatherData = async (lat: number, lng: number) => {
    setWeatherLoading(true);
    
    try {
      const data = await HazardService.getWeatherData(lat, lng);
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
    } finally {
      setWeatherLoading(false);
    }
  };
  
  // Fetch safety score
  const fetchSafetyScore = async (lat: number, lng: number) => {
    setSafetyLoading(true);
    
    try {
      const score = await HazardService.calculateSafetyScore(lat, lng);
      setSafetyScore(score);
    } catch (err) {
      console.error('Error calculating safety score:', err);
    } finally {
      setSafetyLoading(false);
    }
  };
  
  // Fetch heatmap data
  const fetchHeatmapData = async (lat: number, lng: number) => {
    setHeatmapLoading(true);
    
    try {
      const data = await HazardService.getHeatmapData(lat, lng, 500);
      setHeatmapData(data);
    } catch (err) {
      console.error('Error generating heatmap data:', err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  // Effect to handle geolocation changes
  useEffect(() => {
    if (geoLocation && isUsingLiveLocation) {
      setActiveLocation({
        lat: geoLocation.lat,
        lng: geoLocation.lng,
        name: 'Your Location'
      });
      
      // Fetch all data
      fetchHazards(geoLocation.lat, geoLocation.lng);
      fetchWeatherData(geoLocation.lat, geoLocation.lng);
      fetchSafetyScore(geoLocation.lat, geoLocation.lng);
      fetchHeatmapData(geoLocation.lat, geoLocation.lng);
    }
  }, [geoLocation, isUsingLiveLocation]);

  // Effect to handle selected location changes
  useEffect(() => {
    if (selectedLocation) {
      setIsUsingLiveLocation(false);
      setActiveLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: selectedLocation.name
      });
      
      // Fetch all data
      fetchHazards(selectedLocation.lat, selectedLocation.lng);
      fetchWeatherData(selectedLocation.lat, selectedLocation.lng);
      fetchSafetyScore(selectedLocation.lat, selectedLocation.lng);
      fetchHeatmapData(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);

  // Handle use current location button click
  const handleUseCurrentLocation = () => {
    clearSearch();
    setIsUsingLiveLocation(true);
    requestGeolocation();
  };

  // Handle location selection
  const handleLocationSelect = (location: SearchResult) => {
    handleSelectLocation(location);
    setIsUsingLiveLocation(false);
  };

  // Handle sorting
  const handleSortByDistance = () => {
    setHazards([...hazards].sort((a, b) => (a.distance || 0) - (b.distance || 0)));
  };

  const handleSortBySeverity = () => {
    setHazards([...hazards].sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }));
  };
  
  // Toggle heatmap
  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen overflow-auto">
      <h1 className="text-2xl font-bold mb-6">Hazard Reports</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-neutral-200">
        <h2 className="text-lg font-semibold mb-4">Find Hazards Near You</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow">
            <LocationInput
              query={query}
              loading={searchLoading}
              error={searchError}
              results={results}
              onQueryChange={handleQueryChange}
              onSelectLocation={handleLocationSelect}
              onClearSearch={clearSearch}
            />
          </div>
          
          <button
            onClick={handleUseCurrentLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            disabled={geoLoading}
          >
            {geoLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detecting...
              </span>
            ) : (
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Use My Location
              </span>
            )}
          </button>
        </div>
        
        {geoError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">Location Error</p>
            <p>{geoError}</p>
            <p className="mt-2 text-sm">Please enable location services in your browser or try searching for a location instead.</p>
          </div>
        )}
        
        {activeLocation && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
            <p className="font-medium">Active Location</p>
            <p>{activeLocation.name} ({activeLocation.lat.toFixed(4)}, {activeLocation.lng.toFixed(4)})</p>
            <p className="mt-2 text-sm">Showing hazards within 100km of this location</p>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-lg text-gray-600">Loading hazard data...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-6 rounded-lg mb-8">
          <p className="font-medium text-lg">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => activeLocation && fetchHazards(activeLocation.lat, activeLocation.lng)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {activeLocation && !loading && !error ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {hazards.length > 0 
                ? `${hazards.length} Hazards Found Near ${activeLocation.name}`
                : `No Hazards Found Near ${activeLocation.name}`
              }
            </h2>
            
            <div className="flex items-center">
              <button
                onClick={toggleHeatmap}
                className={`px-4 py-2 rounded-lg transition-colors ${showHeatmap ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                {showHeatmap ? 'Hide Heatmap' : 'Show Risk Heatmap'}
              </button>
              {heatmapLoading && (
                <div className="ml-2 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              )}
            </div>
          </div>
          
          <HazardMap 
            hazards={hazards} 
            centerLocation={activeLocation} 
            radiusKm={100}
            heatmapData={heatmapData}
            showHeatmap={showHeatmap}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {weatherLoading ? (
              <div className="bg-gray-50 rounded-lg p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <p>Loading weather data...</p>
              </div>
            ) : weatherData ? (
              <WeatherCard weatherData={weatherData} />
            ) : null}
            
            {safetyLoading ? (
              <div className="bg-gray-50 rounded-lg p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <p>Calculating safety score...</p>
              </div>
            ) : safetyScore ? (
              <SafetyScoreCard safetyScore={safetyScore} />
            ) : null}
          </div>
          
          {hazards.length > 0 && (
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-md font-medium">Hazard List</h3>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={handleSortByDistance}
                >
                  Sort by Distance
                </button>
                <button 
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                  onClick={handleSortBySeverity}
                >
                  Sort by Severity
                </button>
              </div>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pb-4 pr-2 custom-scrollbar">
            {hazards.map((hazard) => (
              <HazardCard key={hazard.id} hazard={hazard} showDistance={true} />
            ))}
          </div>
          
          {hazards.length === 0 && !loading && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Hazards Detected</h3>
              <p className="text-gray-600">
                Good news! No active hazards were found within 100km of this location.
              </p>
            </div>
          )}
        </>
      ) : (
        !loading && !error && (
          <>
            <h2 className="text-lg font-semibold mb-4">Hazard Detection</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="mr-3 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Use location detection for better results</p>
                  <p className="text-blue-700 mt-1">
                    Enable location services or search for a specific location to see hazards within 100km of that area.
                  </p>
                </div>
              </div>
            </div>
          </>
        )
      )}
      
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pb-4 pr-2 custom-scrollbar">
  {hazards.map((hazard) => (
    <HazardCard key={hazard.id} hazard={hazard} showDistance={true} />
  ))}
</div>


    </div>
  );
};

export default HazardReports;
