import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import HazardReports from './pages/HazardReports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import { UserRole } from './types';
import SplashScreen from './components/layout/SplashScreen'; // Import SplashScreen

function App() {
  const [role, setRole] = useState<UserRole>('ambulance');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true); // Control splash visibility

  // Function to toggle offline mode
  const toggleOfflineMode = async (enable: boolean) => {
    try {
      console.log(`App.tsx: Toggling offline mode to ${enable}`);
      
      // Make the API call to toggle offline mode
      const response = await fetch('/api/offline/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enable: enable }),
      });
      
      const data = await response.json();
      console.log('Offline toggle response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle offline mode');
      }
      
      // Update state based on actual server response
      setIsOffline(data.offline_mode);
      
      return true;
    } catch (error) {
      console.error('Error in toggleOfflineMode:', error);
      return false;
    }
  };

  useEffect(() => {
    const handleOnlineStatus = () => {
      const isCurrentlyOffline = !navigator.onLine;
      
      // Only update if we're not already in that state
      if (isOffline !== isCurrentlyOffline) {
        setIsOffline(isCurrentlyOffline);
        
        // If we're coming back online and not in manual offline mode,
        // we could potentially sync data here
      }
    };
    
    // Check initial online status
    setIsOffline(!navigator.onLine);
    
    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Check current offline mode status from server on mount
    const checkOfflineStatus = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          if (data.offline_mode !== undefined) {
            setIsOffline(data.offline_mode);
          }
        }
      } catch (error) {
        console.error('Error checking offline status:', error);
      }
    };
    
    checkOfflineStatus();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [isOffline]);

  // Callback to hide splash after animation
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    // Show splash screen first
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Once splash is done, show the main app
  return (
    <Router>
      <div className="flex flex-col h-screen bg-neutral-50">
        <Header 
          role={role} 
          setRole={setRole} 
          isOffline={isOffline} 
        />
        
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hazards" element={<HazardReports />} />
            <Route path="/settings" element={<Settings isOffline={isOffline} toggleOfflineMode={toggleOfflineMode} />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
        <Footer isOffline={isOffline} version="1.0.0" />
      </div>
    </Router>
  );
}

export default App;
