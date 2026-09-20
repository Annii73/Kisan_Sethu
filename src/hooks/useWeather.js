import { useState } from 'react';

const DISTRICT_TO_CITY = {
  'gautam buddha nagar': 'Noida',
  'gautam buddh nagar': 'Noida',
  'gorakhpur': 'Gorakhpur',
};

const resolveLocationName = (locationName) => {
  const normalized = locationName.trim().toLowerCase();
  return DISTRICT_TO_CITY[normalized] || locationName;
};

const useWeather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [usingLiveLocation, setUsingLiveLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const fetchWeatherDataFromCoordinates = async (latitude, longitude) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

      const wxRes = await fetch(wxUrl);
      if (!wxRes.ok) throw new Error(`Weather fetch failed: ${wxRes.status}`);

      const wx = await wxRes.json();
      if (!wx.current || !wx.daily) throw new Error('Invalid weather data format');

      let locationLabel = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
      const windSpeedKph = (wx.current.wind_speed_10m ?? 0) * 3.6;

      setWeatherData({
        locationLabel,
        current: {
          temperatureC: wx.current.temperature_2m ?? null,
          windSpeedKph,
          weatherCode: wx.current.weather_code ?? null,
          time: wx.current.time ?? null,
        },
        daily: {
          dates: wx.daily.time ?? [],
          maxC: wx.daily.temperature_2m_max ?? [],
          minC: wx.daily.temperature_2m_min ?? [],
          precipitationMm: wx.daily.precipitation_sum ?? [],
        },
      });
    } catch (err) {
      setWeatherError(err.message || 'Unable to load weather data');
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchWeatherDataFromLocation = async (locationName) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const resolvedLocation = resolveLocationName(locationName);
      const cleanLocation = resolvedLocation.split(',').map(s => s.trim()).filter(Boolean).join(', ');

      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanLocation || 'Hyderabad')}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error(`Geocoding failed: ${geoRes.status}`);

      const geoJson = await geoRes.json();
      if (!geoJson.results || geoJson.results.length === 0) {
        const firstPart = cleanLocation.split(',')[0].trim();
        if (firstPart !== cleanLocation) {
          const retryGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(firstPart)}&count=1&language=en&format=json`);
          if (retryGeoRes.ok) {
            const retryGeoJson = await retryGeoRes.json();
            if (retryGeoJson.results?.length > 0) {
              const { latitude, longitude } = retryGeoJson.results[0];
              return fetchWeatherDataFromCoordinates(latitude, longitude);
            }
          }
        }
        throw new Error(`Could not resolve location "${cleanLocation}"`);
      }

      const { latitude, longitude } = geoJson.results[0];
      await fetchWeatherDataFromCoordinates(latitude, longitude);
    } catch (err) {
      setWeatherError(err.message || 'Unable to load weather data');
      setWeatherData(null);
      setWeatherLoading(false);
    }
  };

  const getLiveLocation = (fallbackLocation) => {
    if (!navigator.geolocation) {
      if (fallbackLocation) fetchWeatherDataFromLocation(fallbackLocation);
      return;
    }

    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUsingLiveLocation(true);
        setCurrentLocation({ latitude, longitude });
        fetchWeatherDataFromCoordinates(latitude, longitude);
      },
      () => {
        setUsingLiveLocation(false);
        if (fallbackLocation) fetchWeatherDataFromLocation(fallbackLocation);
        else {
          setWeatherError('Unable to get location');
          setWeatherLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const refreshWeather = () => {
    if (usingLiveLocation && currentLocation) {
      fetchWeatherDataFromCoordinates(currentLocation.latitude, currentLocation.longitude);
    }
  };

  return {
    weatherData,
    weatherLoading,
    weatherError,
    usingLiveLocation,
    getLiveLocation,
    refreshWeather,
  };
};

export default useWeather;
