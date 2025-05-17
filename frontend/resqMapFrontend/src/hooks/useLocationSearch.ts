import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

export interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  country?: string;
  state?: string;
}

interface LocationSearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  selectedLocation: SearchResult | null;
}

export const useLocationSearch = () => {
  const [state, setState] = useState<LocationSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    selectedLocation: null,
  });

  // Create a debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setState(prev => ({ ...prev, results: [], loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Using OpenStreetMap Nominatim API for geocoding
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'ResQMap-App'
            }
          }
        );

        const searchResults: SearchResult[] = response.data.map((item: any) => ({
          name: item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          country: item.address?.country,
          state: item.address?.state
        }));

        setState(prev => ({
          ...prev,
          results: searchResults,
          loading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to search for locations',
          loading: false
        }));
      }
    }, 500)
  ).current;

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleQueryChange = (newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }));
    debouncedSearch(newQuery);
  };

  const handleSelectLocation = (location: SearchResult) => {
    setState(prev => ({
      ...prev,
      selectedLocation: location,
      query: `${location.name}${location.state ? `, ${location.state}` : ''}${location.country ? `, ${location.country}` : ''}`,
      results: []
    }));
  };

  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      selectedLocation: null
    }));
  };

  return {
    ...state,
    handleQueryChange,
    handleSelectLocation,
    clearSearch
  };
};
