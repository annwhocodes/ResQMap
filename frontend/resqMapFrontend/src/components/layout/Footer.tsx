import React from 'react';
import { Wifi, WifiOff, HelpCircle, Info } from 'lucide-react';

interface FooterProps {
  isOffline: boolean;
  version: string;
}

const Footer: React.FC<FooterProps> = ({ isOffline, version }) => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-neutral-600">
          <div className="flex items-center space-x-1">
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4 text-warning-600" />
                <span className="text-warning-600 font-medium">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-success-600" />
                <span className="text-success-600 font-medium">Online</span>
              </>
            )}
          </div>
          <div>
            <span className="text-neutral-500">v{version}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center text-sm text-neutral-600 hover:text-primary-600"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            <span>Help</span>
          </button>
          
          <button 
            className="flex items-center text-sm text-neutral-600 hover:text-primary-600"
            aria-label="About"
          >
            <Info className="h-4 w-4 mr-1" />
            <span>About</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;