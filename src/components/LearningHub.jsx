import React, { useState } from 'react';
import { BookOpen, Play, FileText, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LearningHub = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: t('allTopics') },
    { id: 'crops', name: t('cropManagement') },
    { id: 'soil', name: t('soilHealth') },
    { id: 'irrigation', name: t('irrigation') },
    { id: 'pests', name: t('pestControlCategory') },
    { id: 'organic', name: t('organicFarmingCategory') }
  ];

  const learningContent = [
    {
      id: 1,
      title: t('modernWheatTitle'),
      type: 'video',
      category: 'crops',
      duration: `11 ${t('min')}`,
      description: t('modernWheatDesc'),
      videoId: 'xVO9bjuhB58'
    },
    {
      id: 2,
      title: t('soilTestingTitle'),
      type: 'article',
      category: 'soil',
      readTime: `8 ${t('minRead')}`,
      description: t('soilTestingDesc'),
      thumbnail: 'https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=600&auto=format&fit=crop',
      articleUrl: 'https://ag.umass.edu/greenhouse-floriculture/greenhouse-best-management-practices-bmp-manual/soil-testing'
    },
    {
      id: 3,
      title: t('dripIrrigationTitle'),
      type: 'video',
      category: 'irrigation',
      duration: `18 ${t('min')}`,
      description: t('dripIrrigationDesc'),
      videoId: 'FJF49lb23b8'
    },
    {
      id: 4,
      title: t('ipmTitle'),
      type: 'article',
      category: 'pests',
      readTime: `12 ${t('minRead')}`,
      description: t('ipmDesc'),
      thumbnail: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop',
      articleUrl: 'https://www.fao.org/pest-and-pesticide-management/ipm/integrated-pest-management/en/'
    },
    {
      id: 5,
      title: t('organicCertTitle'),
      type: 'video',
      category: 'organic',
      duration: `5 ${t('min')}`,
      description: t('organicCertDesc'),
      videoId: '0IJX1rCgSYg'
    },
    {
      id: 6,
      title: t('cropRotationTitle'),
      type: 'article',
      category: 'crops',
      readTime: `10 ${t('minRead')}`,
      description: t('cropRotationDesc'),
      thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop',
      articleUrl: 'https://rodaleinstitute.org/why-organic/organic-farming-practices/crop-rotations/'
    }
  ];

  const filteredContent = learningContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleWatchClick = (videoId) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center">
        <BookOpen className="h-8 w-8 text-orange-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('learningHubTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('expandKnowledge')}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchArticles')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col group">
            <div className="relative">
              <img
                src={item.type === 'video' ? `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg` : item.thumbnail}
                alt={item.title}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/cccccc/FFFFFF?text=Image+Not+Found'; }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                {item.type === 'video' 
                  ? <Play className="h-16 w-16 text-white text-opacity-80" />
                  : <FileText className="h-12 w-12 text-white text-opacity-80" />
                }
              </div>
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  item.type === 'video'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {item.type === 'video' ? item.duration : item.readTime}
                </span>
              </div>
            </div>

            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">{item.description}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {categories.find(cat => cat.id === item.category)?.name}
                </span>
                {item.type === 'video' ? (
                  <button
                    onClick={() => handleWatchClick(item.videoId)}
                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-500 text-sm font-medium transition-colors"
                  >
                    {t('watch')}
                  </button>
                ) : (
                  <a
                    href={item.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-500 text-sm font-medium transition-colors"
                  >
                    {t('read')}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('noContentFound')}</p>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
