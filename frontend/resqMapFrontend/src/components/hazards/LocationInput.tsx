import React from 'react';
import { SearchResult } from '../../hooks/useLocationSearch';

interface LocationInputProps {
  query: string;
  loading: boolean;
  error: string | null;
  results: SearchResult[];
  onQueryChange: (query: string) => void;
  onSelectLocation: (location: SearchResult) => void;
  onClearSearch: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  query,
  loading,
  error,
  results,
  onQueryChange,
  onSelectLocation,
  onClearSearch
}) => {
  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={onClearSearch}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute z-10 w-full mt-1 bg-red-50 rounded-lg shadow-lg border border-red-200 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {results.map((result) => (
  <li
    key={`${result.lat},${result.lng}`} // Use coordinates as fallback key
    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
    onClick={() => onSelectLocation(result)}
  >
    <div className="font-medium">{result.name}</div>
    <div className="text-sm text-gray-500 truncate">
      {[result.state, result.country].filter(Boolean).join(', ')}
    </div>
  </li>
))}

        </ul>
      )}
    </div>
  );
};

export default LocationInput;
