import React, { useState, useEffect } from 'react';
import { Sprout, Send, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const CropAdvice = ({ voiceInput }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [userProfile, setUserProfile] = useState({
    cropPlan: '',
    lastHarvestTime: '',
    previousCrop: '',
    chemicalUsage: ''
  });

  const questions = [
    "How long ago was the previous crop harvested?",
    "What was the previous crop?",
    "Have you used any chemical fertilizers or pesticides?"
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);

  // --- First question on mount ---
  useEffect(() => {
    setMessages([{ sender: 'bot', text: "What crops can you plant this season?" }]);
    setAwaitingAnswer(true);
  }, []);

  // --- Automatically submit voice input ---
  useEffect(() => {
    if (voiceInput && awaitingAnswer) {
      handleSubmit(null, voiceInput);
    }
  }, [voiceInput]);

  // --- handleSubmit refactored to accept programmatic input ---
  const handleSubmit = async (e, textInput) => {
    if (e) e.preventDefault();
    const answer = textInput ?? input;

    if (!answer.trim()) return;

    // Add farmer’s reply
    setMessages((prev) => [...prev, { sender: 'user', text: answer }]);

    if (awaitingAnswer) {
      const updatedProfile = { ...userProfile };

      if (!updatedProfile.cropPlan) updatedProfile.cropPlan = answer;
      else if (currentQuestionIndex === 0) updatedProfile.lastHarvestTime = answer;
      else if (currentQuestionIndex === 1) updatedProfile.previousCrop = answer;
      else if (currentQuestionIndex === 2) updatedProfile.chemicalUsage = answer;

      setUserProfile(updatedProfile);

      if (currentQuestionIndex < questions.length) {
        const nextQ = questions[currentQuestionIndex];
        setMessages((prev) => [...prev, { sender: 'bot', text: nextQ }]);
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // All done → fetch AI advice
        setLoading(true); 
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/crop-advice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
              prompt: `As an expert agricultural advisor for Indian farmers, provide detailed practical advice for this farmer profile:
Location: ${user.location || 'India'},
Farm Size: ${user.farmSize || '1'} acres,
Soil Type: ${user.soilType || 'Mixed'},
Planned Crops: ${updatedProfile.cropPlan},
Last Harvest Time: ${updatedProfile.lastHarvestTime},
Previous Crop: ${updatedProfile.previousCrop},
Chemical Usage: ${updatedProfile.chemicalUsage}.
Provide specific, actionable recommendations tailored to Indian conditions.`
            })
          });

          const data = await response.json();
          if (data.success && data.text) {
            setAdvice(data.text);
          } else {
            setAdvice(t('errorAdvice'));
          }
        } catch (error) {
          console.error('Error getting crop advice:', error);
          setAdvice(t('errorAdvice'));
        }
        setLoading(false);
        setAwaitingAnswer(false);
      }
    }

    setInput(''); // reset input
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Sprout className="h-8 w-8 text-primary-600 mr-3" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('aiCropAdvice')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('personalizedRecommendations')}
          </p>
        </div>
      </div>

      {/* Chat Box */}
      <div className="card h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center">
              <Loader className="h-4 w-4 mr-2 animate-spin" /> {t('gettingAdvice')}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {awaitingAnswer && (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="input-field h-16 resize-none flex-1"
            placeholder="Type your answer..."
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Final Recommendation */}
      {advice && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('aiRecommendation')}
          </h3>
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
              {advice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropAdvice;
