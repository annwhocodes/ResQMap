import React from 'react';
import { Hazard } from '../../services/HazardService';

interface HazardCardProps {
  hazard: Hazard;
  showDistance?: boolean;
}

const HazardCard: React.FC<HazardCardProps> = ({ hazard, showDistance = false }) => {
  // Get severity class
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Get icon based on hazard type
  const getHazardIcon = () => {
    switch (hazard.type) {
      case 'earthquake':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'weather':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
        );
      case 'landslide':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        );
      case 'flood':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'fire':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get additional details based on hazard type
  const getHazardDetails = () => {
    if (!hazard.details) return null;

    switch (hazard.type) {
      case 'earthquake':
        return (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">Magnitude:</div>
              <div className="font-medium">{hazard.details.magnitude}</div>
              <div className="text-gray-500">Depth:</div>
              <div className="font-medium">{hazard.details.depth} km</div>
              <div className="text-gray-500">Location:</div>
              <div className="font-medium">{hazard.details.place}</div>
              {hazard.details.tsunami > 0 && (
                <>
                  <div className="text-gray-500">Tsunami:</div>
                  <div className="font-medium text-red-600">Warning Active</div>
                </>
              )}
            </div>
          </div>
        );
      case 'weather':
        return (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">Condition:</div>
              <div className="font-medium">{hazard.details.condition}</div>
              <div className="text-gray-500">Temperature:</div>
              <div className="font-medium">{(hazard.details.temperature - 273.15).toFixed(1)}°C</div>
              <div className="text-gray-500">Wind Speed:</div>
              <div className="font-medium">{hazard.details.windSpeed} m/s</div>
              <div className="text-gray-500">Location:</div>
              <div className="font-medium">{hazard.details.location}, {hazard.details.country}</div>
            </div>
          </div>
        );
      case 'landslide':
        return (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">Event:</div>
              <div className="font-medium">{hazard.details.title}</div>
              <div className="text-gray-500">Date:</div>
              <div className="font-medium">{new Date(hazard.details.date).toLocaleDateString()}</div>
              {hazard.details.sources && hazard.details.sources.length > 0 && (
                <>
                  <div className="text-gray-500">Source:</div>
                  <div className="font-medium">{hazard.details.sources[0].id}</div>
                </>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-neutral-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className="mr-2">{getHazardIcon()}</div>
          <h3 className="font-semibold text-gray-800">
            {hazard.type.charAt(0).toUpperCase() + hazard.type.slice(1)} Hazard
          </h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityClass(hazard.severity)}`}>
          {hazard.severity}
        </span>
      </div>

      <p className="text-neutral-600 text-sm mb-3">{hazard.description}</p>

      <div className="text-sm text-neutral-500 space-y-1">
        {showDistance && hazard.distance !== undefined && (
          <div className="font-medium text-blue-600">
            {hazard.distance.toFixed(1)} km away
          </div>
        )}
        <div>Lat: {hazard.lat.toFixed(4)}</div>
        <div>Lng: {hazard.lng.toFixed(4)}</div>
        <div>Reported: {formatDate(hazard.timestamp)}</div>
      </div>

      {getHazardDetails()}
    </div>
  );
};

export default HazardCard;
