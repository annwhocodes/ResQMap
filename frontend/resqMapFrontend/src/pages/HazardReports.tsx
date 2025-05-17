import React from 'react';
import { mockHazards } from '../mocks/mockData';
import { AlertTriangle, FileWarning, AlertCircle } from 'lucide-react';
import Badge from '../components/common/Badge';

const HazardReports: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hazard Reports</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockHazards.map((hazard) => (
          <div
            key={hazard.id}
            className="bg-white rounded-lg shadow-md p-4 border border-neutral-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                {hazard.type === 'flood' && <FileWarning className="h-5 w-5 text-blue-600 mr-2" />}
                {hazard.type === 'fire' && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
                {hazard.type === 'collapse' && <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />}
                <h3 className="font-semibold">Hazard #{hazard.id}</h3>
              </div>
              <Badge
                variant={
                  hazard.severity === 'high'
                    ? 'danger'
                    : hazard.severity === 'medium'
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {hazard.severity}
              </Badge>
            </div>

            <p className="text-neutral-600 text-sm mb-3">{hazard.description}</p>

            <div className="text-sm text-neutral-500">
              <div>Lat: {hazard.lat}</div>
              <div>Lng: {hazard.lng}</div>
              <div>Reported at: {new Date(hazard.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HazardReports;
