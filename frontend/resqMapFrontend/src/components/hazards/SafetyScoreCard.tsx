import React from 'react';
import { SafetyScore } from '../../services/HazardService';

interface SafetyScoreCardProps {
  safetyScore: SafetyScore;
}

const SafetyScoreCard: React.FC<SafetyScoreCardProps> = ({ safetyScore }) => {
  const { overall, earthquake, weather, landslide, explanation } = safetyScore;
  
  // Get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // Get background class based on overall score
  const getBackgroundClass = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`rounded-lg shadow-md p-4 border ${getBackgroundClass(overall)}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Safety Score</h3>
        <div className={`text-2xl font-bold ${getScoreColorClass(overall)}`}>
          {overall}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Earthquake Risk</span>
            <span className={`text-sm font-medium ${getScoreColorClass(earthquake)}`}>{earthquake}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${earthquake >= 80 ? 'bg-green-500' : earthquake >= 60 ? 'bg-yellow-500' : earthquake >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${earthquake}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Weather Risk</span>
            <span className={`text-sm font-medium ${getScoreColorClass(weather)}`}>{weather}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${weather >= 80 ? 'bg-green-500' : weather >= 60 ? 'bg-yellow-500' : weather >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${weather}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Landslide Risk</span>
            <span className={`text-sm font-medium ${getScoreColorClass(landslide)}`}>{landslide}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${landslide >= 80 ? 'bg-green-500' : landslide >= 60 ? 'bg-yellow-500' : landslide >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${landslide}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-1">Risk Factors:</h4>
        <ul className="text-sm list-disc list-inside max-h-40 overflow-y-auto">
          {explanation.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SafetyScoreCard;
