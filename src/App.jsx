import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sprout, Moon, Sun, Menu, X } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import CropAdvice from './components/CropAdvice';
import Weather from './components/Weather';
import MarketPrices from './components/MarketPrices';
import LearningHub from './components/LearningHub';
import Chatbot from './components/Chatbot';
import SchemeFinder from './components/SchemeFinder';
import Feedback from './components/Feedback';
import PestDetection from './components/PestDetection';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navigation from './components/Navigation';
import Register from "./components/Register";
// --- Voice Control Component ---
const MicIcon = ({ isListening }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors ${isListening ? 'text-red-500' : 'text-gray-500'}`}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const VoiceControl = ({ navigate, toggleDarkMode, toggleLanguage, onVoiceInput }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      setStatusMessage('Listening...');
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech') setStatusMessage('No speech detected.');
      else setStatusMessage('Error occurred.');
      setTimeout(() => setStatusMessage(''), 3000);
    };

    rec.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase().trim();
      setStatusMessage(`Heard: "${command}"`);
      setTimeout(() => {
        handleVoiceCommand(command);
        setStatusMessage('');
      }, 1200);
    };

    setRecognition(rec);
    return () => rec.stop();
  }, []);

  const handleVoiceCommand = (command) => {
    const pageMap = {
      dashboard: '/',
      profile: '/profile',
      'crop advice': '/crop-advice',
      weather: '/weather',
      'market prices': '/market-prices',
      'learning hub': '/learning-hub',
      chatbot: '/chatbot',
      'scheme finder': '/scheme-finder',
      'pest detection': '/pest-detection',
      feedback: '/feedback',
    };

    if (
      command.startsWith('go to ') ||
      command.startsWith('open ') ||
      command.startsWith('show ')
    ) {
      const page = command.replace(/^(go to|open|show)\s+/, '');
      if (pageMap[page]) navigate(pageMap[page]);
      else if (onVoiceInput) onVoiceInput(command); // fallback to input
    } else if (command.includes('dark mode')) {
      toggleDarkMode();
    } else if (command.includes('switch language') || command.includes('change language')) {
      toggleLanguage();
    } else {
      // send remaining text to voice input
      if (onVoiceInput) onVoiceInput(command);
    }
  };

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) recognition.stop();
    else recognition.start();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-center space-y-2">
      {statusMessage && (
        <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm px-3 py-1.5 rounded-full shadow-lg">
          {statusMessage}
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-110 ${
          isListening ? 'bg-red-100 animate-pulse' : 'bg-blue-900 dark:bg-white'
        }`}
        title="Toggle Voice Control"
      >
        <MicIcon isListening={isListening} />
      </button>
    </div>
  );
};

// --- Main AppContent ---
function AppContent() {
  const { user, loading } = useAuth();
  
  const { language, toggleLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [voiceInput, setVoiceInput] = useState('');
  const navigate = useNavigate();
 
  const [appInitialized] = useState(true);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }
  const toggleDarkMode = () => setDarkMode(!darkMode);

  if (!appInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Sprout className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">
            Initializing Kisaan Sethu...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-green-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Kisaan Sethu
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {language === 'en' ? 'हिंदी' : 'English'}
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <Navigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/crop-advice" element={<CropAdvice voiceInput={voiceInput} />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/market-prices" element={<MarketPrices />} />
            <Route path="/learning-hub" element={<LearningHub />} />
            <Route path="/chatbot" element={<Chatbot voiceInput={voiceInput} />} />
            <Route path="/scheme-finder" element={<SchemeFinder />} />
            <Route path="/pest-detection" element={<PestDetection />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Voice Control Floating Mic */}
      <VoiceControl
        navigate={navigate}
        toggleDarkMode={toggleDarkMode}
        toggleLanguage={toggleLanguage}
        onVoiceInput={(text) => setVoiceInput(text)}
      />
    </div>
  );
}

// --- App Wrapper ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
