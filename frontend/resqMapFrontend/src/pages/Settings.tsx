import React, { useState } from 'react';
import Toggle from '../components/common/Toggle';
import Button from '../components/common/Button';
import { Download, Upload, Database, Map } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    offlineMode: true,
    autoSync: true,
    darkMode: false,
    highContrast: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4">Offline Data</h2>
          <div className="space-y-4">
            <Toggle
              label="Enable Offline Mode"
              checked={settings.offlineMode}
              onChange={() => handleToggle('offlineMode')}
            />
            <Toggle
              label="Auto-sync when online"
              checked={settings.autoSync}
              onChange={() => handleToggle('autoSync')}
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="primary"
                icon={<Download className="h-4 w-4" />}
              >
                Download Map Data
              </Button>
              <Button
                variant="outline"
                icon={<Database className="h-4 w-4" />}
              >
                Clear Cache
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
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

        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <Button
              variant="outline"
              fullWidth
              icon={<Upload className="h-4 w-4" />}
            >
              Import Hazard Data
            </Button>
            <Button
              variant="outline"
              fullWidth
              icon={<Map className="h-4 w-4" />}
            >
              Update Map Regions
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;