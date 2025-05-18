import React, { useEffect, useRef, useState } from 'react';
import { Hazard } from '../../services/HazardService';

interface HazardMapProps {
  hazards: Hazard[];
  centerLocation: { lat: number; lng: number; name: string };
  radiusKm?: number;
  heatmapData?: number[][];
  showHeatmap?: boolean;
}

const HazardMap: React.FC<HazardMapProps> = ({ 
  hazards, 
  centerLocation, 
  radiusKm = 100,
  heatmapData = [],
  showHeatmap = false
}) => {
  // Reference for the map container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>({
    centerMarker: null,
    radiusCircle: null,
    hazardMarkers: [],
    heatmapLayer: null
  });
  
  // Track script loading state
  const [scriptsLoaded, setScriptsLoaded] = useState({
    leaflet: false,
    heatPlugin: false
  });
  
  // Effect to load scripts
  useEffect(() => {
    // Check if scripts are already loaded
    if (window.L) {
      setScriptsLoaded(prev => ({ ...prev, leaflet: true }));
    }
    
    if (window.L && window.L.heatLayer) {
      setScriptsLoaded(prev => ({ ...prev, heatPlugin: true }));
    }
    
    // Add Leaflet CSS if not already added
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(linkEl);
    }
    
    // Add Leaflet JS if not already added
    if (!window.L) {
      const scriptEl = document.createElement('script');
      scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      scriptEl.onload = () => setScriptsLoaded(prev => ({ ...prev, leaflet: true }));
      document.body.appendChild(scriptEl);
    }
    
    // Add Leaflet Heat plugin if not already added
    if (!window.L || !window.L.heatLayer) {
      const heatScriptEl = document.createElement('script');
      heatScriptEl.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
      heatScriptEl.onload = () => setScriptsLoaded(prev => ({ ...prev, heatPlugin: true }));
      document.body.appendChild(heatScriptEl);
    }
    
    return () => {
      // Clean up
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Effect to initialize map when scripts are loaded
  useEffect(() => {
    if (scriptsLoaded.leaflet && scriptsLoaded.heatPlugin && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [scriptsLoaded]);
  
  // Effect to update map when center location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [centerLocation.lat, centerLocation.lng], 
        10
      );
      
      // Update center marker and radius circle
      updateCenterMarker();
      updateRadiusCircle();
    }
  }, [centerLocation, radiusKm]);
  
  // Effect to update hazard markers
  useEffect(() => {
    if (mapInstanceRef.current && hazards) {
      updateHazardMarkers();
    }
  }, [hazards]);
  
  // Effect to update heatmap
  useEffect(() => {
    if (mapInstanceRef.current && window.L && window.L.heatLayer) {
      console.log("Updating heatmap with data:", heatmapData.length, "points, showHeatmap:", showHeatmap);
      updateHeatmap();
    }
  }, [heatmapData, showHeatmap]);
  
  // Initialize map
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.L) return;
    
    console.log("Initializing map");
    
    // Create map instance
    const map = window.L.map(mapContainerRef.current).setView(
      [centerLocation.lat, centerLocation.lng], 
      10
    );
    
    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Store map instance
    mapInstanceRef.current = map;
    
    // Add center marker and radius circle
    updateCenterMarker();
    updateRadiusCircle();
    
    // Add hazard markers
    updateHazardMarkers();
    
    // Add heatmap if data is available
    if (heatmapData.length > 0 && showHeatmap) {
      updateHeatmap();
    }
  };
  
  // Update center marker
  const updateCenterMarker = () => {
    if (!mapInstanceRef.current || !window.L) return;
    
    // Remove existing center marker
    if (markersRef.current.centerMarker) {
      mapInstanceRef.current.removeLayer(markersRef.current.centerMarker);
    }
    
    // Add new center marker
    markersRef.current.centerMarker = window.L.marker([centerLocation.lat, centerLocation.lng])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${centerLocation.name}</b>`)
      .openPopup();
  };
  
  // Update radius circle
  const updateRadiusCircle = () => {
    if (!mapInstanceRef.current || !window.L) return;
    
    // Remove existing radius circle
    if (markersRef.current.radiusCircle) {
      mapInstanceRef.current.removeLayer(markersRef.current.radiusCircle);
    }
    
    // Add new radius circle
    markersRef.current.radiusCircle = window.L.circle([centerLocation.lat, centerLocation.lng], {
      color: 'blue',
      fillColor: '#30a0ff',
      fillOpacity: 0.1,
      radius: radiusKm * 1000 // Convert to meters
    }).addTo(mapInstanceRef.current);
  };
  
  // Update hazard markers
  const updateHazardMarkers = () => {
    if (!mapInstanceRef.current || !window.L || !hazards) return;
    
    // Remove existing hazard markers
    if (markersRef.current.hazardMarkers.length > 0) {
      markersRef.current.hazardMarkers.forEach((marker: any) => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current.hazardMarkers = [];
    }
    
    // Add new hazard markers
    markersRef.current.hazardMarkers = hazards.map(hazard => {
      // Determine marker color based on severity
      const severityColor = 
        hazard.severity === 'high' ? '#dc2626' :
        hazard.severity === 'medium' ? '#d97706' : '#059669';
      
      // Create marker
      const marker = window.L.circleMarker([hazard.lat, hazard.lng], {
        color: severityColor,
        fillColor: severityColor,
        fillOpacity: 0.6,
        radius: 8
      }).addTo(mapInstanceRef.current);
      
      // Create popup content
      let popupContent = `
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">${hazard.type.charAt(0).toUpperCase() + hazard.type.slice(1)} Hazard</h3>
          <p style="margin-bottom: 8px;">${hazard.description}</p>
          <div style="font-size: 0.9em; color: #666;">
            <div>Severity: <span style="font-weight: bold;">${hazard.severity}</span></div>
            ${hazard.distance ? `<div>Distance: <span style="font-weight: bold;">${hazard.distance.toFixed(1)} km</span></div>` : ''}
            <div>Coordinates: ${hazard.lat.toFixed(4)}, ${hazard.lng.toFixed(4)}</div>
          </div>
      `;
      
      // Add hazard-specific details
      if (hazard.details) {
        switch (hazard.type) {
          case 'earthquake':
            popupContent += `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div>Magnitude: <strong>${hazard.details.magnitude}</strong></div>
                <div>Depth: <strong>${hazard.details.depth} km</strong></div>
                ${hazard.details.tsunami > 0 ? '<div style="color: #dc2626; font-weight: bold;">Tsunami Warning Active</div>' : ''}
              </div>
            `;
            break;
          case 'weather':
            popupContent += `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div>Condition: <strong>${hazard.details.condition}</strong></div>
                <div>Temperature: <strong>${(hazard.details.temperature - 273.15).toFixed(1)}°C</strong></div>
                <div>Wind: <strong>${hazard.details.windSpeed} m/s</strong></div>
              </div>
            `;
            break;
          case 'landslide':
            popupContent += `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <div>Date: <strong>${new Date(hazard.details.date).toLocaleDateString()}</strong></div>
              </div>
            `;
            break;
        }
      }
      
      popupContent += '</div>';
      
      // Bind popup to marker
      marker.bindPopup(popupContent);
      
      return marker;
    });
  };
  
  // Update heatmap
  const updateHeatmap = () => {
    if (!mapInstanceRef.current || !window.L || !window.L.heatLayer) {
      console.log("Cannot update heatmap: missing dependencies");
      return;
    }
    
    // Remove existing heatmap
    if (markersRef.current.heatmapLayer) {
      mapInstanceRef.current.removeLayer(markersRef.current.heatmapLayer);
      markersRef.current.heatmapLayer = null;
    }
    
    // Add new heatmap if enabled
    if (showHeatmap && heatmapData && heatmapData.length > 0) {
      console.log("Creating heatmap layer with", heatmapData.length, "points");
      
      try {
        // Create simple test data if heatmap data is empty or invalid
        let dataToUse = heatmapData;
        
        if (!heatmapData.length || !Array.isArray(heatmapData[0])) {
          console.log("Using fallback heatmap data");
          // Create a grid of points around center location
          dataToUse = [];
          for (let i = -10; i <= 10; i++) {
            for (let j = -10; j <= 10; j++) {
              const lat = centerLocation.lat + (i * 0.05);
              const lng = centerLocation.lng + (j * 0.05);
              const intensity = 100 - Math.sqrt(i*i + j*j) * 5;
              if (intensity > 0) {
                dataToUse.push([lat, lng, intensity]);
              }
            }
          }
        }
        
        // Configure gradient
        const gradient = {
          0.0: 'green',
          0.25: 'yellow',
          0.5: 'orange',
          0.75: 'red',
          1.0: 'darkred'
        };
        
        // Create heatmap layer
        markersRef.current.heatmapLayer = window.L.heatLayer(dataToUse, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          max: 100,
          gradient
        }).addTo(mapInstanceRef.current);
        
        console.log("Heatmap layer created successfully");
      } catch (error) {
        console.error("Error creating heatmap:", error);
      }
    } else {
      console.log("Skipping heatmap creation:", showHeatmap ? "No data available" : "Heatmap disabled");
    }
  };
  
  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-96 rounded-lg shadow-md border border-neutral-200 mb-6"
    >
      {(!scriptsLoaded.leaflet || !scriptsLoaded.heatPlugin) && (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
};

// Add type definition for window.L
declare global {
  interface Window {
    L: any;
  }
}

export default HazardMap;
