import React from 'react';
import { Navigation, AlertTriangle, Wifi, Map } from 'lucide-react';

const Help: React.FC = () => {
  return (
    <div className="h-screen overflow-y-auto p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Help & Documentation</h1>

      <div className="space-y-6 pb-10">
        {/* Quick Start Guide */}
        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-primary-600" />
            Quick Start Guide
          </h2>
          <div className="prose">
            <ol className="list-decimal list-inside space-y-2">
              <li>Select your response role from the header dropdown</li>
              <li>Enter source and destination locations</li>
              <li>Configure route options based on emergency needs</li>
              <li>Click "Generate Best Route" to get directions</li>
              <li>Monitor the map for hazards and route updates</li>
            </ol>
          </div>
        </section>

        {/* Emergency Features */}
        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
            Emergency Features
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Dynamic Re-routing</h3>
              <p className="text-neutral-600">Automatically updates your route when new hazards are reported.</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Emergency Mode</h3>
              <p className="text-neutral-600">Prioritizes speed over standard traffic rules while maintaining safety.</p>
            </div>
          </div>
        </section>

        {/* Offline Usage */}
        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Wifi className="h-5 w-5 mr-2 text-green-600" />
            Offline Usage
          </h2>
          <div className="space-y-2">
            <p>ResQmap works offline after initial data download:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Download map data for your region</li>
              <li>Enable offline mode in Settings</li>
              <li>Sync when connection is available</li>
            </ul>
          </div>
        </section>

        {/* Map Legend */}
        <section className="bg-white rounded-lg shadow-md p-4 border border-neutral-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Map className="h-5 w-5 mr-2 text-blue-600" />
            Map Legend
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>High-risk Hazard</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Medium-risk Hazard</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Safe Route</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <span>Waypoint</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;
