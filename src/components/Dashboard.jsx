import React, { useState, useEffect, useRef } from 'react';
import { Sprout, Cloud, TrendingUp, BookOpen, MessageCircle, Languages, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Profile from './Profile';

// Some Indian district names aren't recognized by the geocoding API —
// map them to their main city so weather/market lookups still work
const DISTRICT_TO_CITY = {
  'gautam buddha nagar': 'Noida',
  'gautam buddh nagar': 'Noida',
  'gorakhpur': 'Gorakhpur', // district & city same name, but kept for consistency
  // add more district → city mappings here as you test with other users
};

const resolveLocationName = (locationName) => {
  const normalized = locationName.trim().toLowerCase();
  return DISTRICT_TO_CITY[normalized] || locationName;
};


const Dashboard = () => {
  const { user } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [usingLiveLocation, setUsingLiveLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const dropdownRef = useRef();

  useEffect(() => {
    if (user?.isProfileComplete) {
      // Try to get live location first, fallback to profile location
      getLiveLocation();
      fetchMarketData();
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      console.log('Dashboard: Geolocation is not supported by this browser');
      // Fallback to profile location
      if (user?.location) {
        fetchWeatherDataFromLocation(user.location);
      } else {
        setWeatherData({ error: 'Please enable location access or set your location in your profile.' });
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Dashboard: Live location obtained:', { latitude, longitude });
        setUsingLiveLocation(true);
        setCurrentLocation({ latitude, longitude });
        fetchWeatherDataFromCoordinates(latitude, longitude);
      },
      (error) => {
        console.log('Dashboard: Geolocation error:', error);
        // Fallback to profile location
        setUsingLiveLocation(false);
        if (user?.location) {
          fetchWeatherDataFromLocation(user.location);
        } else {
          setWeatherData({ error: 'Unable to get your location. Please enable location access or set your location in your profile.' });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchWeatherDataFromCoordinates = async (latitude, longitude) => {
    try {
      // Fetch weather directly using coordinates (no geocoding needed)
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

      console.log('Dashboard: Fetching weather data from coordinates:', wxUrl);
      const wxRes = await fetch(wxUrl);
      
      if (!wxRes.ok) {
        const errorText = await wxRes.text();
        console.error('Dashboard: Weather API error response:', errorText);
        throw new Error(`Weather fetch failed: ${wxRes.status} ${wxRes.statusText}`);
      }

      const wx = await wxRes.json();
      console.log('Dashboard: Weather data received:', wx);

      // Validate response structure
      if (!wx.current || !wx.daily) {
        console.error('Dashboard: Invalid weather response structure:', wx);
        throw new Error('Invalid weather data format received from API');
      }

      // Get location name from reverse geocoding
      let locationLabel = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      try {
        const reverseGeoUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;
        const reverseGeoRes = await fetch(reverseGeoUrl);
        if (reverseGeoRes.ok) {
          const reverseGeoJson = await reverseGeoRes.json();
          if (reverseGeoJson.results && reverseGeoJson.results.length > 0) {
            const place = reverseGeoJson.results[0];
            locationLabel = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
            console.log('Dashboard: Reverse geocoded location:', locationLabel);
          }
        }
      } catch (e) {
        console.log('Dashboard: Reverse geocoding failed, using coordinates:', e);
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
    } catch (error) {
      console.error('Dashboard: Error fetching weather data:', error);
      console.error('Dashboard: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setWeatherData({ error: error.message || 'Unknown error' });
    }
  };

  const fetchWeatherDataFromLocation = async (locationName) => {
    try {
      const resolvedLocation = resolveLocationName(locationName); // ← new line
    // Clean up location string - remove extra commas, trim whitespace
    const cleanLocation = resolvedLocation.split(',').map(s => s.trim()).filter(Boolean).join(', '); // ← locationName → resolvedLocation
    
      // Step 1: geocode location to lat/long
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cleanLocation || 'Hyderabad'
      )}&count=1&language=en&format=json`;

      console.log('Dashboard: Fetching geo data from:', geoUrl);
      const geoRes = await fetch(geoUrl);
      
      if (!geoRes.ok) {
        const errorText = await geoRes.text();
        console.error('Dashboard: Geocoding API error response:', errorText);
        throw new Error(`Geocoding failed: ${geoRes.status} ${geoRes.statusText}`);
      }

      const geoJson = await geoRes.json();
      console.log('Dashboard: Geocoding response:', geoJson);
      
      if (!geoJson.results || geoJson.results.length === 0) {
        // Try with just the first part of the location (before comma)
        const firstPart = cleanLocation.split(',')[0].trim();
        if (firstPart !== cleanLocation) {
          console.log('Dashboard: Trying with simplified location:', firstPart);
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
        throw new Error(`Could not resolve location "${cleanLocation}" to coordinates. Please try using your current location.`);
      }

      const place = geoJson.results[0];
      const { latitude, longitude } = place;
      console.log('Dashboard: Resolved location:', { name: place.name, latitude, longitude });

      // Fetch weather using coordinates
      await fetchWeatherDataFromCoordinates(latitude, longitude);
    } catch (error) {
      console.error('Dashboard: Error fetching weather data:', error);
      console.error('Dashboard: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setWeatherData({ error: error.message || 'Unknown error' });
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

  const fetchMarketData = async () => {
    try {
      const res = await fetch(
        `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=20`
      );
      const data = await res.json();

      if (!data.records || data.records.length === 0) {
        throw new Error("No records returned");
      }

      const commodities = data.records.slice(0, 6).map(r => ({
        name: r.commodity,
        unit: '₹/quintal',
        price: Number(r.modal_price),
        min: Number(r.min_price),
        max: Number(r.max_price),
        market: r.market,
        state: r.state,
      }));

      setMarketData({
        locationLabel: `${user.location}, India`,
        lastUpdate: new Date().toISOString(),
        commodities,
      });
    } catch (error) {
      console.error('Error fetching mandi prices:', error);
      setMarketData({ error: true });
    }
  };

  if (!user?.isProfileComplete) return <Profile />;

  const quickActions = [
    { icon: Sprout, label: t('getCropAdvice'), path: '/crop-advice', color: 'bg-green-500' },
    { icon: Cloud, label: t('weatherAlerts'), path: '/weather', color: 'bg-blue-500' },
    { icon: TrendingUp, label: t('marketPrices'), path: '/market-prices', color: 'bg-purple-500' },
    { icon: BookOpen, label: t('learningHub'), path: '/learning-hub', color: 'bg-orange-500' },
    { icon: MessageCircle, label: t('askAiHelper'), path: '/chatbot', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('welcomeBack')}, {user.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {user.location} • {user.farmSize} {t('farmSize').includes('acres') ? 'acres' : 'एकड़'} • {user.soilType} {t('soilType').includes('Soil')}
          </p>
        </div>

        {/* Language Dropdown */}
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <Languages className="h-4 w-4 mr-2" />
            {supportedLanguages.find(l => l.code === language)?.label || 'Language'}
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.353a.75.75 0 011.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                {supportedLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setDropdownOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${lang.code === language ? 'font-semibold bg-gray-200 dark:bg-gray-700' : ''
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {quickActions.map(({ icon: Icon, label, path, color }) => (
          <a key={path} href={path} className="card hover:shadow-xl transition-shadow cursor-pointer text-center">
            <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          </a>
        ))}
      </div>

      {/* Weather & Market */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weather Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cloud className="h-6 w-6 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('weatherUpdate')}</h2>
              {usingLiveLocation && (
                <Navigation className="h-4 w-4 text-green-500 ml-2" title="Using current location" />
              )}
            </div>
            <button
              onClick={getLiveLocation}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
              title="Use current location"
            >
              <Navigation className="h-3 w-3" />
              Live
            </button>
          </div>
          {weatherData ? (
            weatherData.error ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load weather: {weatherData.error}
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-3">
                  <p className="font-medium">{weatherData.locationLabel}</p>
                  {weatherData.current.temperatureC !== null && (
                    <p>
                      Now: <span className="font-semibold">{Math.round(weatherData.current.temperatureC)}°C</span> • Wind {Math.round(weatherData.current.windSpeedKph)} km/h
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {weatherData.daily.dates.slice(0, 3).map((dateStr, idx) => (
                    <div key={dateStr} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">{new Date(dateStr).toLocaleDateString()}</p>
                      <p className="text-sm">Max {Math.round(weatherData.daily.maxC[idx])}°C</p>
                      <p className="text-sm">Min {Math.round(weatherData.daily.minC[idx])}°C</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Rain {Math.round(weatherData.daily.precipitationMm[idx])} mm</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </div>

        {/* Market Card */}
        <div className="card">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('marketPrices')}</h2>
          </div>
          {marketData ? (
            marketData.error ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load market prices. Please try again later.
              </div>
            ) : (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">{marketData.locationLabel}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Updated {new Date(marketData.lastUpdate).toLocaleTimeString()}</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {marketData.commodities.map(item => (
                    <div key={item.name + item.market} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">{item.market}, {item.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.price.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-500">Min {item.min} / Max {item.max}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
