import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, MapPin, Search, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MarketPrices = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [marketData, setMarketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    applyFilters();
  }, [marketData, searchTerm, selectedState, selectedCommodity]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to use proxy first, fallback to direct URL
      const apiUrl = import.meta.env.DEV 
        ? '/api/live-mandi-prices'  // Use proxy in development
        : `${import.meta.env.VITE_API_URL}/api/live-mandi-prices`;  // Direct URL in production

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200));
        throw new Error(
          "Server returned HTML instead of JSON. Please verify the backend API is running and the endpoint is correct."
        );}

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch mandi prices');
      }

      if (result.data && result.data.length > 0) {
        setMarketData(result.data);
        setLastUpdated(result.timestamp);
        setIsCached(result.cached || false);
      } else {
        setMarketData([]);
        setError('No data available');
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      let errorMessage = error.message || 'Live data unavailable — please try again later.';
      
      // Provide helpful error messages
      if (errorMessage.includes('HTML') || errorMessage.includes('DOCTYPE')) {
        errorMessage =
  "Backend server not responding. Please ensure the backend server is running on port 5001.";
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Cannot connect to server. Please check if the backend server is running.';
      }
      errorMessage =
      "Backend server not responding. Please ensure the backend server is running on port 5001.";
      setError(errorMessage);
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...marketData];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.commodity?.toLowerCase().includes(searchLower) ||
        item.market?.toLowerCase().includes(searchLower) ||
        item.district?.toLowerCase().includes(searchLower) ||
        item.state?.toLowerCase().includes(searchLower) ||
        item.variety?.toLowerCase().includes(searchLower)
      );
    }

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(item => item.state === selectedState);
    }

    // Commodity filter
    if (selectedCommodity !== 'all') {
      filtered = filtered.filter(item => item.commodity === selectedCommodity);
    }

    setFilteredData(filtered);
  };

  // Get unique states and commodities for filters
  const uniqueStates = [...new Set(marketData.map(item => item.state).filter(Boolean))].sort();
  const uniqueCommodities = [...new Set(marketData.map(item => item.commodity).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("marketPrices")}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              {lastUpdated && (
                <span>
                  Updated: {new Date(lastUpdated).toLocaleString()}
                  {isCached && <span className="ml-2 text-yellow-600">(Cached)</span>}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchMarketData}
          className="btn-secondary flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? t("updating") : t("refresh")}
        </button>
      </div>

      {/* Search and Filters */}
      {!loading && marketData.length > 0 && (
        <div className="card">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search commodity, market, district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="input-field flex-1"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Commodity Filter */}
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="input-field"
            >
              <option value="all">All Commodities</option>
              {uniqueCommodities.map(commodity => (
                <option key={commodity} value={commodity}>{commodity}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">
            Fetching latest mandi prices...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchMarketData}
                className="text-sm text-red-700 dark:text-red-300 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && filteredData.length === 0 && marketData.length === 0 && (
        <div className="card text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {t("noDataForLocation") || "No mandi prices available"}
          </p>
        </div>
      )}

      {/* No Results from Filters */}
      {!loading && !error && marketData.length > 0 && filteredData.length === 0 && (
        <div className="card text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            No results match your filters. Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Price Table */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredData.length} of {marketData.length} records
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Commodity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Variety</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Market</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">State</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">District</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Min Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Max Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Modal Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {item.commodity || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {item.variety || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {item.market || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {item.state || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {item.district || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                    ₹{item.minPrice?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                    ₹{item.maxPrice?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                    ₹{item.modalPrice?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                    {item.date || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MarketPrices;
