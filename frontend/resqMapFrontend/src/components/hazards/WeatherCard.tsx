import React from 'react';
import { WeatherData } from '../../services/HazardService';

interface WeatherCardProps {
  weatherData: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weatherData }) => {
  const { current, forecasts, warnings, severity } = weatherData;

  // Get severity class
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'low':
        return 'bg-sky-100 border-sky-300 text-sky-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg shadow-md p-4 border ${getSeverityClass(severity)}`}>
      <h3 className="text-lg font-semibold mb-2">Weather Warning</h3>
      <p className="text-sm mb-2">Severity: {severity}</p>
      
      <div className="mb-3">
        <h4 className="font-medium text-sm">Current Conditions:</h4>
        <p className="text-sm">{current.description}</p>
        <div className="grid grid-cols-2 gap-1 text-sm mt-1">
          <div>Temperature: {current.temperature.toFixed(1)}°C</div>
          <div>Rainfall: {current.rainfall.toFixed(1)} mm/h</div>
          <div>Wind Speed: {current.windSpeed.toFixed(1)} km/h</div>
          <div>Pressure: {current.pressure} hPa</div>
          <div>Humidity: {current.humidity}%</div>
          <div>Visibility: {current.visibility.toFixed(1)} km</div>
        </div>
      </div>
      
      {warnings.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-sm">Active Warnings:</h4>
          <ul className="list-disc list-inside text-sm">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {forecasts.length > 0 && (
        <div>
          <h4 className="font-medium text-sm">Forecast Warnings:</h4>
          <div className="text-sm mt-1 max-h-40 overflow-y-auto">
            {forecasts.map((forecast, index) => (
              <div key={index} className="mb-1">
                {forecast.time}: {forecast.description} ({forecast.temperature.toFixed(1)}°C, {forecast.windSpeed.toFixed(1)} km/h)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
