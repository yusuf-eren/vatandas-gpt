import { useState, useEffect } from 'react';
import LocationPermission from '@/components/LocationPermission';
import ChatInterface from '@/components/ChatInterface';
import { MainLayout } from '@/components/MainLayout';

const Index = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [showLocationPermission, setShowLocationPermission] = useState(false);

  useEffect(() => {
    // Check if location is already stored
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        setLocation(parsedLocation);
        console.log('Using stored location:', parsedLocation);
      } catch (error) {
        console.error('Error parsing stored location:', error);
        localStorage.removeItem('userLocation');
      }
    }
    setIsCheckingLocation(false);
  }, []);

  const handleLocationReceived = (userLocation: { latitude: number; longitude: number } | null) => {
    setLocation(userLocation);
    setShowLocationPermission(false);
    if (userLocation) {
      localStorage.setItem('userLocation', JSON.stringify(userLocation));
      console.log('Location granted:', userLocation);
    }
  };

  const handleLocationPermissionClose = () => {
    setShowLocationPermission(false);
  };

  if (isCheckingLocation) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ChatInterface 
        location={location} 
        onRequestLocation={() => setShowLocationPermission(true)}
      />
      
      {/* Location Permission Modal - shown when needed */}
      {showLocationPermission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleLocationPermissionClose} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <LocationPermission onLocationReceived={handleLocationReceived} />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Index;
