import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from '../../types';
import { AlertTriangle } from 'lucide-react';

// Fix the Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hazard icon
const hazardIcon = (severity: string) => {
  return L.divIcon({
    className: 'hazard-icon',
    html: `<div class="p-1 rounded-full bg-${severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'blue'}-500">
            <div class="h-3 w-3"></div>
          </div>`,
    iconSize: [20, 20],
  });
};

interface MapViewProps {
  route: Route | null;
  hazards: any[];
  className?: string;
}

// Component to recenter map when route changes
const MapRecenter = ({ route }: { route: Route | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (route && route.waypoints && route.waypoints.length > 0) {
      const bounds = route.waypoints.map(wp => [wp.lat, wp.lng]);
      map.fitBounds(bounds);
    }
  }, [route, map]);
  
  return null;
};

const MapView: React.FC<MapViewProps> = ({ route, hazards, className }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Default center (Mumbai)
  const defaultCenter: [number, number] = [19.0760, 72.8777];
  
  // Process route for display
  const routeCoordinates = route?.waypoints?.map(wp => [wp.lat, wp.lng] as [number, number]) || [];

  return (
    <div className={`relative rounded-lg border border-neutral-200 shadow-md overflow-hidden ${className}`}>
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-neutral-600">Loading map...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapLoaded(true)}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render the route if available */}
        {routeCoordinates.length > 0 && (
          <>
            <Polyline 
              positions={routeCoordinates}
              color="#3B82F6"
              weight={5}
              opacity={0.7}
            />
            
            {/* Start marker */}
            <Marker position={routeCoordinates[0]}>
              <Popup>Start: {route?.waypoints[0].name}</Popup>
            </Marker>
            
            {/* End marker */}
            <Marker position={routeCoordinates[routeCoordinates.length - 1]}>
              <Popup>Destination: {route?.waypoints[routeCoordinates.length - 1].name}</Popup>
            </Marker>
          </>
        )}
        
        {/* Render hazards */}
        {hazards.map((hazard) => (
          <Marker 
            key={hazard.id} 
            position={[hazard.lat, hazard.lng]}
            icon={hazardIcon(hazard.severity)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                  {hazard.type.charAt(0).toUpperCase() + hazard.type.slice(1)}
                </div>
                <div>{hazard.description}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {new Date(hazard.timestamp).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Recenter map when route changes */}
        <MapRecenter route={route} />
      </MapContainer>
      
      {/* Map overlay with route details */}
      {route && (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-neutral-200 z-[1000] max-w-xs">
          <h3 className="font-medium mb-1">Route Details</h3>
          <div className="text-sm">
            <div>Distance: {(route.distance / 1000).toFixed(1)} km</div>
            <div>Estimated time: {Math.round(route.duration / 60)} min</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;