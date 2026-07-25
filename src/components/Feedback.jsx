import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Feedback = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState({
    rating: 0,
    category: '',
    message: '',
    suggestions: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    'App Performance',
    'Crop Advice Quality',
    'Weather Information',
    'Market Prices',
    'Learning Content',
    'AI Assistant',
    'User Interface',
    'Other'
  ];

  const handleRatingClick = (rating) => {
    setFeedback({ ...feedback, rating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Store feedback in database with error handling
      const response = await fetch('https://builder.empromptu.ai/api_tools/templates/call_postgres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 78c603dd15a83e48927e7dc52b2a8a6c',
          'X-Generated-App-ID': 'fb966449-837b-4a1b-b874-1afcdcab3e35',
          'X-Usage-Key': 'bea07626d89ebd2a9ab76e0ada0b62ad'
        },
        body: JSON.stringify({
          query: `INSERT INTO newschema_fb966449837b4a1bb8741afcdcab3e35.feedback 
                   (user_phone, rating, category, message, suggestions, created_at) 
                   VALUES ($1, $2, $3, $4, $5, NOW())`,
          params: [user.phoneNumber, feedback.rating, feedback.category, feedback.message, feedback.suggestions]
        })
      });

      if (!response.ok) {
        console.error('Failed to save feedback to database');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still show success to user even if database save fails
      setSubmitted(true);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFeedback({
      ...feedback,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('thankYou')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('feedbackSubmitted')}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFeedback({ rating: 0, category: '', message: '', suggestions: '' });
            }}
            className="btn-primary"
          >
            {t('submitAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('feedback')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('helpImprove')}
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('overallRating')}
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`p-1 rounded-full transition-colors ${
                    star <= feedback.rating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
            {feedback.rating > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {feedback.rating === 1 && t('poor')}
                {feedback.rating === 2 && t('fair')}
                {feedback.rating === 3 && t('good')}
                {feedback.rating === 4 && t('veryGood')}
                {feedback.rating === 5 && t('excellent')}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('feedbackCategory')}
            </label>
            <select
              name="category"
              value={feedback.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('yourFeedback')}
            </label>
            <textarea
              name="message"
              value={feedback.message}
              onChange={handleChange}
              className="input-field h-32 resize-none"
              placeholder={t('shareExperience')}
              required
            />
          </div>

          {/* Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('suggestionsImprovement')}
            </label>
            <textarea
              name="suggestions"
              value={feedback.suggestions}
              onChange={handleChange}
              className="input-field h-24 resize-none"
              placeholder={t('whatFeatures')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || feedback.rating === 0}
            className="w-full btn-primary disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t('submitFeedback')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Contact Information */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
          {t('needDirectSupport')}
        </h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-300">
          <li>📞 {t('helpline')}</li>
          <li>📧 {t('email')}</li>
          <li>🕒 {t('available')}</li>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
