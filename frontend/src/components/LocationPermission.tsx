import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationPermissionProps {
  onLocationReceived: (location: { latitude: number; longitude: number } | null) => void;
}

const LocationPermission = ({ onLocationReceived }: LocationPermissionProps) => {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    setIsRequesting(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t('places.geolocationNotSupported'));
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        onLocationReceived(location);
        setIsRequesting(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError(t('places.locationAccessError'));
        setIsRequesting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const continueWithoutLocation = () => {
    onLocationReceived(null);
  };

  return (
    <div className="w-full text-center space-y-6">
        <div className="mx-auto w-16 md:w-20 h-16 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <MapPin className="w-8 md:w-10 h-8 md:h-10 text-gray-600 dark:text-gray-400" />
        </div>
            
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {t('places.enableLocationAccess')}
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('places.locationDescription')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={requestLocation}
            disabled={isRequesting}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-xl h-11 md:h-12 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRequesting ? t('places.gettingLocation') : t('places.allowLocationAccess')}
          </button>

          <button
            onClick={continueWithoutLocation}
            className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl h-11 md:h-12 font-semibold text-sm md:text-base border border-gray-200 dark:border-gray-700 transition-colors"
          >
            {t('places.continueWithoutAccess')}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
          {t('places.locationPrivacyNote')}
        </p>
    </div>
  );
};

export default LocationPermission;
