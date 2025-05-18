import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Map, Check, X, AlertTriangle, Navigation, Info } from 'lucide-react';

// Props interface for Settings component
interface SettingsProps {
  isOffline: boolean;
  toggleOfflineMode: (enable: boolean) => void;
}

// Toggle Component
const Toggle = ({ label, checked, onChange, disabled }) => {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-medium ${disabled ? 'text-gray-400' : ''}`}>{label}</span>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          checked ? 'bg-emerald-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

// Button Component
const Button = ({ children, variant = 'primary', icon, onClick, fullWidth, disabled, isLoading }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    outline: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-emerald-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled || isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : icon}
      {children}
    </button>
  );
};

// Notification Component
const Notification = ({ type, message, onClose }) => {
  const bgColors = {
    success: 'bg-green-100 border-green-500',
    error: 'bg-red-100 border-red-500',
    warning: 'bg-yellow-100 border-yellow-500',
  };

  const icons = {
    success: <Check className="h-5 w-5 text-green-500" />,
    error: <X className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  return (
    <div className={`flex items-center p-4 mb-4 rounded-md border-l-4 ${bgColors[type]}`}>
      <div className="mr-3">{icons[type]}</div>
      <div className="text-sm flex-grow">{message}</div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Route Planner Component
const RoutePlanner = ({ isOffline }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState(['']);
  const [routeInfo, setRouteInfo] = useState({
    distance: '',
    duration: '',
    via: [],
    hazards: []
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  const addWaypoint = () => {
    setWaypoints([...waypoints, '']);
  };

  const removeWaypoint = (index) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    setWaypoints(newWaypoints);
  };

  const updateWaypoint = (index, value) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = value;
    setWaypoints(newWaypoints);
  };

  const calculateRoute = () => {
    if (!origin || !destination) return;
    
    setIsCalculating(true);
    
    // Simulate API call for route calculation
    setTimeout(() => {
      // Generate random distance between 800-2000 km
      const distance = Math.floor(800 + Math.random() * 1200);
      
      // Generate random duration between 10-30 hours
      const durationHours = 10 + Math.random() * 20;
      const durationFormatted = `${Math.floor(durationHours)}.${Math.floor((durationHours % 1) * 10)} hours`;
      
      // Generate via points from waypoints + origin/destination
      const via = [origin, ...waypoints.filter(wp => wp.trim() !== ''), destination];
      
      // Generate random hazards
      const possibleHazards = [
        'Seasonal flooding near river crossings',
        'Landslide debris on mountain passes',
        'Heavy traffic congestion in urban areas',
        'Road construction delays',
        'Wildlife crossing zones',
        'Poor visibility in fog-prone regions'
      ];
      
      const hazards = [];
      const hazardCount = Math.floor(Math.random() * 3) + 1; // 1-3 hazards
      
      for (let i = 0; i < hazardCount; i++) {
        const randomIndex = Math.floor(Math.random() * possibleHazards.length);
        if (!hazards.includes(possibleHazards[randomIndex])) {
          hazards.push(possibleHazards[randomIndex]);
        }
      }
      
      setRouteInfo({
        distance: `${distance} km`,
        duration: durationFormatted,
        via,
        hazards
      });
      
      setShowRoute(true);
      setIsCalculating(false);
    }, 1500);
  };
  
  return (
    <section className={`rounded-lg p-4 border ${isOffline ? 'bg-gray-100 border-gray-300' : 'bg-white border-neutral-200'} shadow-md mb-6`}>
      <h2 className="text-lg font-semibold mb-4">Route Planner</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Origin</label>
          <input 
            type="text" 
            value={origin} 
            onChange={(e) => setOrigin(e.target.value)} 
            placeholder="Enter origin city"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input 
            type="text" 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)} 
            placeholder="Enter destination city"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Waypoints</label>
            <button 
              onClick={addWaypoint}
              className="text-sm text-emerald-600 hover:text-emerald-800"
            >
              + Add Waypoint
            </button>
          </div>
          
          {waypoints.map((waypoint, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={waypoint} 
                onChange={(e) => updateWaypoint(index, e.target.value)} 
                placeholder={`Waypoint ${index + 1}`}
                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button 
                onClick={() => removeWaypoint(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        
        <Button
          variant="primary"
          icon={<Navigation className="h-4 w-4" />}
          onClick={calculateRoute}
          isLoading={isCalculating}
          disabled={!origin || !destination}
          fullWidth
        >
          Calculate Route
        </Button>
      </div>
      
      {showRoute && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="font-bold text-lg mb-3">{origin} to {destination} Route</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Distance:</span>
              <p className="font-bold">{routeInfo.distance}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Duration:</span>
              <p className="font-bold">{routeInfo.duration}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">Via:</span>
            <p className="font-medium">
              {routeInfo.via.map((point, index) => (
                <span key={index}>
                  {index > 0 && <span className="mx-1">→</span>}
                  <span className="font-bold">{point}</span>
                </span>
              ))}
            </p>
          </div>
          
          {routeInfo.hazards.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500">Hazards Avoided:</span>
              <ul className="list-disc list-inside text-sm">
                {routeInfo.hazards.map((hazard, index) => (
                  <li key={index}>{hazard}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
            <span>Calculated {isOffline ? 'offline' : 'online'}</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </section>
  );
};

// Model Info Component
const ModelInfo = ({ darkMode }) => {
  return (
    <div className={`mt-8 p-4 rounded-lg border ${darkMode ? 'bg-gray-100 border-gray-300' : 'bg-white border-neutral-200'} text-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-emerald-600" />
        <h3 className="font-semibold">Model Information</h3>
      </div>
      <div className="space-y-2 text-gray-600">
        <p><span className="font-medium">Model:</span> Claude 3.7 Sonnet</p>
        <p><span className="font-medium">Status:</span> <span className="text-emerald-600">Loaded</span></p>
        <p><span className="font-medium">Version:</span> 2025.02.19</p>
        <p><span className="font-medium">Last Updated:</span> May 18, 2025</p>
        <p className="text-xs italic mt-1">Using Claude 3.7 Sonnet with extended reasoning capabilities enabled.</p>
      </div>
    </div>
  );
};

// Main Settings Component
const Settings: React.FC<SettingsProps> = ({ isOffline, toggleOfflineMode }) => {
  // State management
  const [settings, setSettings] = useState({
    offlineMode: isOffline,
    autoSync: true,
    darkMode: false,
    highContrast: false,
  });
  
  const [loadingStates, setLoadingStates] = useState({
    downloadMap: false,
    clearCache: false,
    importData: false,
    updateMap: false,
    toggleOffline: false,
  });
  
  const [notifications, setNotifications] = useState([]);
  const [notificationId, setNotificationId] = useState(0);

  // Update settings when isOffline prop changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      offlineMode: isOffline
    }));
  }, [isOffline]);

  // Add notification function
  const addNotification = (type, message) => {
    const id = notificationId;
    setNotifications([...notifications, { id, type, message }]);
    setNotificationId(id + 1);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Remove notification function
  const removeNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Set loading state helper
  const setLoading = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Handle offline mode toggle
  const handleOfflineModeToggle = async (newValue) => {
    setLoading('toggleOffline', true);
    
    try {
      console.log(`Attempting to toggle offline mode to: ${newValue}`);
      
      // For debugging - log the request
      console.log("Making request to /api/offline/toggle");
      
      try {
        // Make direct API call to backend
        const response = await fetch('/api/offline/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enable: newValue }),
        });
        
        // Check if response is empty
        const text = await response.text();
        console.log("Raw response:", text);
        
        if (!text) {
          console.log("Empty response received, using fallback");
          // Use fallback approach - just update UI without backend
          toggleOfflineMode(newValue);
          setSettings(prev => ({
            ...prev,
            offlineMode: newValue
          }));
          
          // Save to localStorage
          localStorage.setItem('appSettings', JSON.stringify({
            ...settings,
            offlineMode: newValue
          }));
          
          addNotification('success', `Offline mode has been ${newValue ? 'enabled' : 'disabled'} (local only)`);
          return;
        }
        
        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Invalid JSON response:', text);
          throw new Error('Server returned invalid JSON');
        }
        
        console.log('Toggle response:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to toggle offline mode');
        }
        
        // Call the parent component's toggleOfflineMode function
        toggleOfflineMode(data.offline_mode !== undefined ? data.offline_mode : newValue);
        
        // Update local state based on actual server response
        setSettings(prev => ({
          ...prev,
          offlineMode: data.offline_mode !== undefined ? data.offline_mode : newValue
        }));
        
        // Save to localStorage
        localStorage.setItem('appSettings', JSON.stringify({
          ...settings,
          offlineMode: data.offline_mode !== undefined ? data.offline_mode : newValue
        }));
        
        // Add notification
        addNotification('success', `Offline mode has been ${data.offline_mode ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Network or parsing error:', error);
        
        // Fallback to local-only mode
        console.log("Using fallback approach due to error");
        toggleOfflineMode(newValue);
        setSettings(prev => ({
          ...prev,
          offlineMode: newValue
        }));
        
        // Save to localStorage
        localStorage.setItem('appSettings', JSON.stringify({
          ...settings,
          offlineMode: newValue
        }));
        
        addNotification('warning', `Offline mode toggled locally. Server connection failed.`);
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
      addNotification('error', `Failed to toggle offline mode: ${error.message}`);
    } finally {
      setLoading('toggleOffline', false);
    }
  };

  // Toggle setting handler
  const handleToggle = (key) => {
    if (key === 'offlineMode') {
      handleOfflineModeToggle(!settings.offlineMode);
      return;
    }
    
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      
      // Add notification
      addNotification('success', `${key} has been ${newSettings[key] ? 'enabled' : 'disabled'}`);
      
      return newSettings;
    });
  };

  // Action handlers
  const handleDownloadMap = () => {
    setLoading('downloadMap', true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading('downloadMap', false);
      addNotification('success', 'Map data has been downloaded successfully');
    }, 1500);
  };

  const handleClearCache = () => {
    setLoading('clearCache', true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading('clearCache', false);
      addNotification('warning', 'Cache has been cleared');
    }, 1000);
  };

  const handleImportData = () => {
    setLoading('importData', true);
    
    // Simulate API call with potential error
    setTimeout(() => {
      setLoading('importData', false);
      const isError = Math.random() > 0.7;
      
      if (isError) {
        addNotification('error', 'Failed to import hazard data. Please try again.');
      } else {
        addNotification('success', 'Hazard data imported successfully');
      }
    }, 2000);
  };

  const handleUpdateMap = () => {
    setLoading('updateMap', true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading('updateMap', false);
      addNotification('success', 'Map regions have been updated');
    }, 1800);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({
        ...parsedSettings,
        offlineMode: isOffline // Always use the prop value for offlineMode
      }));
    }
  }, []);

  // Apply dark mode when setting changes
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Apply high contrast mode
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings.highContrast]);

  // Determine theme-based classes
  const bgClass = settings.darkMode ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-900';
  const sectionClass = settings.darkMode ? 'bg-gray-100 border-gray-300 shadow-lg' : 'bg-white border-neutral-200 shadow-md';

  return (
    <div className={`h-screen overflow-y-auto p-6 transition-colors duration-200 ${bgClass}`}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        {/* Notifications */}
        <div className="mb-6">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              message={notification.message}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
        
        {/* Route Planner (Only visible when offline mode is enabled) */}
        {settings.offlineMode && <RoutePlanner isOffline={settings.offlineMode} />}
        
        <div className="space-y-6">
          <section className={`rounded-lg p-4 border ${sectionClass}`}>
            <h2 className="text-lg font-semibold mb-4">Offline Data</h2>
            <div className="space-y-4">
              <Toggle
                label="Enable Offline Mode"
                checked={settings.offlineMode}
                onChange={() => handleToggle('offlineMode')}
                disabled={loadingStates.toggleOffline}
              />
              <Toggle
                label="Auto-sync when online"
                checked={settings.autoSync}
                onChange={() => handleToggle('autoSync')}
                disabled={!settings.offlineMode}
              />
              <div className="flex gap-3 mt-4">
                <Button
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleDownloadMap}
                  isLoading={loadingStates.downloadMap}
                  disabled={!settings.offlineMode}
                >
                  Download Map Data
                </Button>
                <Button
                  variant="outline"
                  icon={<Database className="h-4 w-4" />}
                  onClick={handleClearCache}
                  isLoading={loadingStates.clearCache}
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          </section>
          
          <section className={`rounded-lg p-4 border ${sectionClass}`}>
            <h2 className="text-lg font-semibold mb-4">Display</h2>
            <div className="space-y-4">
              <Toggle
                label="Dark Mode"
                checked={settings.darkMode}
                onChange={() => handleToggle('darkMode')}
              />
              <Toggle
                label="High Contrast"
                checked={settings.highContrast}
                onChange={() => handleToggle('highContrast')}
              />
            </div>
          </section>
          
          <section className={`rounded-lg p-4 border ${sectionClass}`}>
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                fullWidth
                icon={<Upload className="h-4 w-4" />}
                onClick={handleImportData}
                isLoading={loadingStates.importData}
              >
                Import Hazard Data
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={<Map className="h-4 w-4" />}
                onClick={handleUpdateMap}
                isLoading={loadingStates.updateMap}
              >
                Update Map Regions
              </Button>
            </div>
          </section>
          
          {/* Model Information Section */}
          <ModelInfo darkMode={settings.darkMode} />
        </div>
      </div>
    </div>
  );
};

export default Settings;