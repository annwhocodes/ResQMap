import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // Show tagline after a short delay
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 1000); // Show tagline after 1 second

    // Complete splash screen after 2.5 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000); // Display for 2.5 seconds
    
    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center justify-center h-screen bg-white"
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      >
        <motion.img
          src="logo.jpg" // Replace with your actual logo path
          alt="Logo"
          className="w-32 h-32"
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
        
        <AnimatePresence>
          {showTagline && (
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.p
                className="text-gray-700 text-xl italic"
              >
                Build for Heroes, Designed for Disasters.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;