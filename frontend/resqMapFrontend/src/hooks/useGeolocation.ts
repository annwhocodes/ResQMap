import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  location: {
    lat: number;
    lng: number;
  } | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    location: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        loading: false,
        error: 'Geolocation is not supported by your browser',
        location: null,
      });
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setState({
        loading: false,
        error: error.message,
        location: null,
      });
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      options
    );

    return () => {
      // Cleanup if needed
    };
  }, []);

  const requestGeolocation = () => {
    setState({
      loading: true,
      error: null,
      location: null,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        setState({
          loading: false,
          error: error.message,
          location: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { ...state, requestGeolocation };
};
