import React, { useState } from 'react';
import { User, MapPin, Ruler, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    farmSize: user?.farmSize || '',
    soilType: user?.soilType || ''
  });
  const [loading, setLoading] = useState(false);

  const soilTypes = [
    'Alluvial Soil',
    'Black Soil (Regur)',
    'Red Soil',
    'Laterite Soil',
    'Desert Soil',
    'Mountain Soil',
    'Saline Soil'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    await updateProfile(formData);
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="flex items-center mb-6">
          <User className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.isProfileComplete ? t('updateProfile') : t('completeProfile')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('helpPersonalized')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              {t('name')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder={t('enterFullName')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              {t('location')}
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input-field"
              placeholder={t('cityState')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Ruler className="inline h-4 w-4 mr-1" />
              {t('farmSize')}
            </label>
            <input
              type="number"
              name="farmSize"
              value={formData.farmSize}
              onChange={handleChange}
              className="input-field"
              placeholder={t('enterFarmSize')}
              min="0.1"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Layers className="inline h-4 w-4 mr-1" />
              {t('soilType')}
            </label>
            <select
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">{t('selectSoilType')}</option>
              {soilTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
