import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

export interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  address: string;
}

export const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        
        const formattedResults: SearchResult[] = data.map((item: any) => ({
          id: item.place_id,
          name: item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type,
          address: item.display_name
        }));

        setResults(formattedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleSelectLocation = (location: SearchResult) => {
    setSelectedLocation(location);
    setQuery(location.name);
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedLocation(null);
  };

  return {
    query,
    results,
    loading,
    error,
    selectedLocation,
    handleQueryChange,
    handleSelectLocation,
    clearSearch
  };
};
