import React, { useState, useEffect } from 'react';
import {
  Cloud, Thermometer, Droplets, Wind,
  AlertTriangle, Sun, CloudRain, CloudSun, MapPin, Navigation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Some Indian district names aren't recognized by the geocoding API —
// map them to their main city so weather lookups still work
const DISTRICT_TO_CITY = {
  'gautam buddha nagar': 'Noida',
  'gautam buddh nagar': 'Noida',
  'gorakhpur': 'Gorakhpur',
  // add more district → city mappings here as you test with other users
};

const resolveLocationName = (locationName) => {
  const normalized = locationName.trim().toLowerCase();
  return DISTRICT_TO_CITY[normalized] || locationName;
};


const Weather = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingLiveLocation, setUsingLiveLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Try to get live location first, fallback to profile location
    getLiveLocation();
  }, []);

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      // Fallback to profile location
      if (user?.location) {
        fetchWeatherDataFromLocation(user.location);
      } else {
        setLoading(false);
        setError('Please enable location access or set your location in your profile.');
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Live location obtained:', { latitude, longitude });
        setUsingLiveLocation(true);
        setCurrentLocation({ latitude, longitude });
        fetchWeatherDataFromCoordinates(latitude, longitude);
      },
      (error) => {
        console.log('Geolocation error:', error);
        // Fallback to profile location
        setUsingLiveLocation(false);
        if (user?.location) {
          fetchWeatherDataFromLocation(user.location);
        } else {
          setLoading(false);
          setError('Unable to get your location. Please enable location access or set your location in your profile.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const WeatherIcon = ({ condition, ...props }) => {
    if (!condition) return <Cloud className="text-gray-400" {...props} />;
    const c = condition.toLowerCase();
    if (c.includes('sun')) return <Sun className="text-yellow-400" {...props} />;
    if (c.includes('partly')) return <CloudSun className="text-sky-400" {...props} />;
    if (c.includes('rain')) return <CloudRain className="text-blue-400" {...props} />;
    if (c.includes('cloud')) return <Cloud className="text-gray-400" {...props} />;
    return <Cloud className="text-gray-400" {...props} />;
  };

  const fetchWeatherDataFromCoordinates = async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch weather directly using coordinates (no geocoding needed)
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

      console.log('Fetching weather data from coordinates:', wxUrl);
      const wxRes = await fetch(wxUrl);
      
      if (!wxRes.ok) {
        const errorText = await wxRes.text();
        console.error('Weather API error response:', errorText);
        throw new Error(`Weather fetch failed: ${wxRes.status} ${wxRes.statusText}`);
      }

      const wx = await wxRes.json();
      console.log('Weather data received:', wx);

      // Validate response structure
      if (!wx.current || !wx.daily) {
        console.error('Invalid weather response structure:', wx);
        throw new Error('Invalid weather data format received from API');
      }

      // Get location name from reverse geocoding using Open-Meteo's reverse geocoding
      let locationLabel = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      try {
        // Open-Meteo reverse geocoding endpoint
        const reverseGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;
        const reverseGeoRes = await fetch(reverseGeoUrl);
        if (reverseGeoRes.ok) {
          const reverseGeoJson = await reverseGeoRes.json();
          if (reverseGeoJson.results && reverseGeoJson.results.length > 0) {
            const place = reverseGeoJson.results[0];
            locationLabel = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
            console.log('Reverse geocoded location:', locationLabel);
          }
        }
      } catch (e) {
        console.log('Reverse geocoding failed, using coordinates:', e);
        // Fallback: locationLabel already set with coordinates
      }

      // Convert wind speed from m/s to km/h (Open-Meteo returns m/s)
      const windSpeedMs = wx.current.wind_speed_10m ?? 0;
      const windSpeedKph = windSpeedMs * 3.6; // Convert m/s to km/h

      const formatted = {
        locationLabel: locationLabel,
        current: {
          temperatureC: wx.current.temperature_2m ?? null,
          windSpeedKph: windSpeedKph,
          weatherCode: wx.current.weather_code ?? null,
          time: wx.current.time ?? null,
        },
        daily: {
          dates: wx.daily.time ?? [],
          maxC: wx.daily.temperature_2m_max ?? [],
          minC: wx.daily.temperature_2m_min ?? [],
          precipitationMm: wx.daily.precipitation_sum ?? [],
        },
      };

      setWeatherData(formatted);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || t('unableToLoad'));
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataFromLocation = async (locationName) => {
    setLoading(true);
    setError(null);
    try {
      const resolvedLocation = resolveLocationName(locationName); // ← naya
      // Clean up location string - remove extra commas, trim whitespace
      const cleanLocation = resolvedLocation.split(',').map(s => s.trim()).filter(Boolean).join(', '); // ← locationName → resolvedLocation
      // Step 1: geocode location to lat/long
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cleanLocation || 'Hyderabad'
      )}&count=1&language=en&format=json`;

      console.log('Fetching geo data from:', geoUrl);
      const geoRes = await fetch(geoUrl);
      
      if (!geoRes.ok) {
        const errorText = await geoRes.text();
        console.error('Geocoding API error response:', errorText);
        throw new Error(`Geocoding failed: ${geoRes.status} ${geoRes.statusText}`);
      }

      const geoJson = await geoRes.json();
      console.log('Geocoding response:', geoJson);
      
      if (!geoJson.results || geoJson.results.length === 0) {
        // Try with just the first part of the location (before comma)
        const firstPart = cleanLocation.split(',')[0].trim();
        if (firstPart !== cleanLocation) {
          console.log('Trying with simplified location:', firstPart);
          const retryGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(firstPart)}&count=1&language=en&format=json`;
          const retryGeoRes = await fetch(retryGeoUrl);
          if (retryGeoRes.ok) {
            const retryGeoJson = await retryGeoRes.json();
            if (retryGeoJson.results && retryGeoJson.results.length > 0) {
              const place = retryGeoJson.results[0];
              const { latitude, longitude } = place;
              return fetchWeatherDataFromCoordinates(latitude, longitude);
            }
          }
        }
        throw new Error(`Could not resolve location "${cleanLocation}" to coordinates. Please try a different location name or use your current location.`);
      }

      const place = geoJson.results[0];
      const { latitude, longitude } = place;
      console.log('Resolved location:', { name: place.name, latitude, longitude });

      // Fetch weather using coordinates
      await fetchWeatherDataFromCoordinates(latitude, longitude);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || t('unableToLoad'));
      setWeatherData(null);
      setLoading(false);
    }
  };

  const fetchWeatherData = () => {
    if (usingLiveLocation && currentLocation) {
      fetchWeatherDataFromCoordinates(currentLocation.latitude, currentLocation.longitude);
    } else if (user?.location) {
      fetchWeatherDataFromLocation(user.location);
    } else {
      getLiveLocation();
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        ))}
      </div>
      <div className="space-y-6">
        <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  );

  const InfoCard = ({ icon, title, value, gradient }) => (
    <div className={`p-4 rounded-xl text-white shadow-lg ${gradient}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Cloud className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('weatherForecast')}
            </h1>
            <div className="flex items-center gap-2">
              {usingLiveLocation ? (
                <>
                  <Navigation className="h-4 w-4 text-green-500" />
                  <p className="text-gray-600 dark:text-gray-300">
                    {weatherData?.locationLabel || 'Current Location'}
                  </p>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-600 dark:text-gray-300">
                    {weatherData?.locationLabel || user?.location || 'Location'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={getLiveLocation}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm border border-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
            title="Use current location"
          >
            <Navigation className="h-4 w-4" />
            {loading ? t('updating') : 'Live'}
          </button>
          <button
            onClick={fetchWeatherData}
            className="px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('updating') : t('refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        renderLoadingSkeleton()
      ) : error ? (
        <div className="card text-center py-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchWeatherData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      ) : weatherData ? (
        <>
          {/* Current Weather */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard
              icon={<Thermometer size={24} />}
              title={t('temperature')}
              value={
                weatherData.current.temperatureC !== null
                  ? `${Math.round(weatherData.current.temperatureC)}°C`
                  : '—'
              }
              gradient="from-red-500 to-orange-500 bg-gradient-to-br"
            />
            <InfoCard
              icon={<Droplets size={24} />}
              title={t('humidity')}
              value="—" // Open-Meteo free API doesn’t return humidity in this call
              gradient="from-sky-500 to-blue-500 bg-gradient-to-br"
            />
            <InfoCard
              icon={<Wind size={24} />}
              title={t('windSpeed')}
              value={
                weatherData.current.windSpeedKph !== null
                  ? `${Math.round(weatherData.current.windSpeedKph)} km/h`
                  : '—'
              }
              gradient="from-slate-500 to-gray-500 bg-gradient-to-br"
            />
            <InfoCard
              icon={<CloudRain size={24} />}
              title={t('rainfall')}
              value={`${Math.round(weatherData.daily.precipitationMm[0] ?? 0)} mm`}
              gradient="from-indigo-500 to-purple-500 bg-gradient-to-br"
            />
          </div>

          {/* 7-Day Forecast */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('sevenDayForecast')}
            </h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4">
                {weatherData.daily.dates.map((dateStr, idx) => (
                  <div
                    key={dateStr}
                    className="flex-shrink-0 w-28 text-center p-3 border dark:border-gray-700 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <p className="font-bold text-gray-800 dark:text-white">
                      {new Date(dateStr).toLocaleDateString(undefined, {
                        weekday: 'short',
                      })}
                    </p>
                    <WeatherIcon
                      condition="partly cloudy"
                      className="h-10 w-10 mx-auto my-2"
                    />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {Math.round(weatherData.daily.maxC[idx])}°
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(weatherData.daily.minC[idx])}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-10 bg-gray-50 dark:bg-gray-800">
          <Cloud className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('unableToLoad')}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
