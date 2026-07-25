import React, { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SchemeFinder = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      // Set schemes data immediately (don't wait for API)
      const schemesData = [
        {
          id: 1,
          name: 'PM-KISAN Samman Nidhi',
          category: 'financial',
          description: 'Direct income support of ₹6,000 per year to small and marginal farmers',
          eligibility: 'Small and marginal farmers with cultivable land up to 2 hectares',
          benefits: '₹2,000 every 4 months (₹6,000 annually)',
          applicationProcess: 'Online application through PM-KISAN portal or CSC centers',
          status: 'Active',
          officialUrl: 'https://pmkisan.gov.in/'
        },
        {
          id: 2,
          name: 'Pradhan Mantri Fasal Bima Yojana',
          category: 'insurance',
          description: 'Crop insurance scheme providing financial support to farmers in case of crop failure',
          eligibility: 'All farmers growing notified crops in notified areas',
          benefits: 'Insurance coverage for crop losses due to natural calamities',
          applicationProcess: 'Through banks, insurance companies, or online portal',
          status: 'Active',
          officialUrl: 'https://pmfby.gov.in/'
        },
        {
          id: 3,
          name: 'Soil Health Card Scheme',
          category: 'technical',
          description: 'Provides soil health cards to farmers with recommendations for appropriate nutrients',
          eligibility: 'All farmers across the country',
          benefits: 'Free soil testing and nutrient recommendations',
          applicationProcess: 'Contact local agriculture department or soil testing labs',
          status: 'Active',
          officialUrl: 'https://soilhealth.dac.gov.in/'
        },
        {
          id: 4,
          name: 'Kisan Credit Card',
          category: 'financial',
          description: 'Credit facility for farmers to meet their agricultural and allied activities',
          eligibility: 'Farmers with land ownership documents',
          benefits: 'Easy access to credit at subsidized interest rates',
          applicationProcess: 'Apply through banks with required documents',
          status: 'Active',
          officialUrl: 'https://www.india.gov.in/spotlight/kisan-credit-card-scheme'
        },
        {
          id: 5,
          name: 'National Mission for Sustainable Agriculture',
          category: 'technical',
          description: 'Promotes sustainable agriculture practices and climate resilient farming',
          eligibility: 'Farmers adopting sustainable farming practices',
          benefits: 'Technical support and financial assistance for sustainable farming',
          applicationProcess: 'Through state agriculture departments',
          status: 'Active',
          officialUrl: 'https://nmsa.dac.gov.in/'
        },
        {
          id: 6,
          name: 'Pradhan Mantri Krishi Sinchai Yojana',
          category: 'technical',
          description: 'Irrigation scheme to expand cultivated area with assured irrigation and improve water use efficiency',
          eligibility: 'All farmers, with priority to small and marginal farmers',
          benefits: 'Subsidies for drip/sprinkler irrigation systems, water harvesting structures',
          applicationProcess: 'Apply through state irrigation departments or agriculture offices',
          status: 'Active',
          officialUrl: 'https://pmksy.gov.in/'
        },
        {
          id: 7,
          name: 'Sub-Mission on Agricultural Mechanization',
          category: 'equipment',
          description: 'Promotes farm mechanization for small and marginal farmers',
          eligibility: 'Small and marginal farmers, women farmers, SC/ST farmers',
          benefits: '40-50% subsidy on agricultural machinery and equipment',
          applicationProcess: 'Apply through state agriculture departments or DBT portal',
          status: 'Active',
          officialUrl: 'https://agrimachinery.nic.in/'
        },
        {
          id: 8,
          name: 'Paramparagat Krishi Vikas Yojana',
          category: 'technical',
          description: 'Promotes organic farming and certification of organic produce',
          eligibility: 'Farmers willing to adopt organic farming practices',
          benefits: '₹50,000 per hectare over 3 years for organic farming',
          applicationProcess: 'Through state organic farming agencies',
          status: 'Active',
          officialUrl: 'https://pgsindia-ncof.gov.in/'
        },
        {
          id: 9,
          name: 'National Food Security Mission',
          category: 'technical',
          description: 'Increases production and productivity of rice, wheat, pulses, and coarse cereals',
          eligibility: 'Farmers growing targeted crops in identified districts',
          benefits: 'Seeds, fertilizers, and technical support at subsidized rates',
          applicationProcess: 'Through district agriculture offices',
          status: 'Active',
          officialUrl: 'https://nfsm.gov.in/'
        },
        {
          id: 10,
          name: 'Rashtriya Krishi Vikas Yojana',
          category: 'financial',
          description: 'State-specific agriculture development programs with flexible funding',
          eligibility: 'Farmers in participating states',
          benefits: 'Infrastructure development, technology adoption support',
          applicationProcess: 'Through state agriculture departments',
          status: 'Active',
          officialUrl: 'https://rkvy.nic.in/'
        },
        {
          id: 11,
          name: 'Interest Subvention Scheme',
          category: 'financial',
          description: 'Provides short-term crop loans at subsidized interest rates',
          eligibility: 'Farmers with Kisan Credit Card or crop loans',
          benefits: 'Interest rate reduced to 7% per annum, additional 3% subvention for timely repayment',
          applicationProcess: 'Automatic benefit through banks for eligible loans',
          status: 'Active',
          officialUrl: 'https://www.nabard.org/'
        },
        {
          id: 12,
          name: 'National Horticulture Mission',
          category: 'technical',
          description: 'Promotes holistic growth of horticulture sector covering fruits, vegetables, root & tuber crops',
          eligibility: 'Farmers, entrepreneurs, self-help groups in horticulture',
          benefits: 'Subsidies for planting material, irrigation, post-harvest infrastructure',
          applicationProcess: 'Through state horticulture departments',
          status: 'Active',
          officialUrl: 'https://nhm.nic.in/'
        }
      ];

      // Set schemes immediately
      setSchemes(schemesData);
      setLoading(false);

     
    } catch (error) {
      console.error('Error in fetchSchemes:', error);
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: t('allCategories') },
    { id: 'financial', name: t('financialSupport') },
    { id: 'insurance', name: t('insurance') },
    { id: 'technical', name: t('technicalSupport') },
    { id: 'equipment', name: t('equipmentSubsidy') }
  ];

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Search className="h-8 w-8 text-green-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('governmentSchemesTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('findSubsidies')} {user?.location || 'India'}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchSchemes')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field md:w-48"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schemes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map(scheme => (
            <div key={scheme.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                      {scheme.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      scheme.category === 'financial' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      scheme.category === 'insurance' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      scheme.category === 'technical' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {categories.find(cat => cat.id === scheme.category)?.name}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {scheme.description}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                  {scheme.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {t('eligibility')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {scheme.eligibility}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {t('benefits')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {scheme.benefits}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t('howToApply')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {scheme.applicationProcess}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {t('viewDetails')}
                </button>
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t('visitOfficialPage')}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredSchemes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('noSchemesFound')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SchemeFinder;
