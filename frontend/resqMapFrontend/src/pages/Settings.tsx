import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Map, Check, X, AlertTriangle } from 'lucide-react';

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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
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
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    outline: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-blue-500",
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

  // Handle offline mode toggle with backend communication
  const handleOfflineModeToggle = async (newValue) => {
    setLoading('toggleOffline', true);
    
    try {
      console.log(`Attempting to toggle offline mode to: ${newValue}`);
      
      // Make direct API call to backend
      const response = await fetch('/api/offline/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enable: newValue }),
      });
      
      const data = await response.json();
      console.log('Toggle response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle offline mode');
      }
      
      // Call the parent component's toggleOfflineMode function
      toggleOfflineMode(data.offline_mode);
      
      // Update local state based on actual server response
      setSettings(prev => ({
        ...prev,
        offlineMode: data.offline_mode
      }));
      
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify({
        ...settings,
        offlineMode: data.offline_mode
      }));
      
      // Add notification
      addNotification('success', `Offline mode has been ${data.offline_mode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling offline mode:', error);
      addNotification('error', `Failed to toggle offline mode: ${error.message}`);
    } finally {
      setLoading('toggleOffline', false);
    }
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
  const bgClass = settings.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const sectionClass = settings.darkMode ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-neutral-200 shadow-md';

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
        </div>
      </div>
    </div>
  );
};

export default Settings;
