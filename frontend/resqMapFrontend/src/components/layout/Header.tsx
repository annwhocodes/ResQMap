import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navigation, Droplet, AlertTriangle, Settings, HelpCircle, FileText } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import Badge from '../common/Badge';
import { UserRole } from '../../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isOffline: boolean;
}

const Header: React.FC<HeaderProps> = ({ role, setRole, isOffline }) => {
  const location = useLocation();
  
  const roleOptions = [
    { value: 'ambulance', label: 'Ambulance', icon: <Navigation className="h-5 w-5 text-danger-600" /> },
    { value: 'fireTruck', label: 'Fire Truck', icon: <Droplet className="h-5 w-5 text-danger-600" /> },
    { value: 'police', label: 'Police', icon: <AlertTriangle className="h-5 w-5 text-primary-600" /> },
    { value: 'custom', label: 'Custom', icon: <Navigation className="h-5 w-5 text-neutral-600" /> },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <Navigation className="h-7 w-7 text-danger-600" />
            <h1 className="text-2xl font-bold text-neutral-900">ResQmap</h1>
          </Link>
          
          {isOffline && (
            <Badge variant="warning" className="ml-2">
              Offline Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="w-48">
            <Dropdown
              options={roleOptions}
              value={role}
              onChange={(value) => setRole(value as UserRole)}
            />
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              to="/hazards"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors
                ${location.pathname === '/hazards' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'}`}
            >
              <FileText className="h-5 w-5" />
              <span>Hazards</span>
            </Link>
            
            <Link
              to="/settings"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors
                ${location.pathname === '/settings' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'}`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            
            <Link
              to="/help"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors
                ${location.pathname === '/help' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'}`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Help</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;