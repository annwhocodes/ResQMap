import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import HazardReports from './pages/HazardReports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import { UserRole } from './types';
import SplashScreen from './components/layout/SplashScreen';  // Import SplashScreen

function App() {
  const [role, setRole] = useState<UserRole>('ambulance');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);  // Control splash visibility

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

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
        
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hazards" element={<HazardReports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
        
        <Footer 
          isOffline={isOffline} 
          version="1.0.0" 
        />
      </div>
    </Router>
  );
}

export default App;
