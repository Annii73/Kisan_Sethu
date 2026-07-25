import React, { useState, useCallback, useRef, useImperativeHandle } from 'react';
import { useLanguage } from '../context/LanguageContext';

// --- Mock Data for Simulation ---
const mockData = {
  diseaseName: 'Tomato Late Blight',
  confidence: 95.8,
  description:
    'Late blight is a potentially devastating disease of tomatoes and potatoes, caused by the fungus-like oomycete Phytophthora infestans. It thrives in cool, moist conditions.',
  symptoms: [
    'Large, dark, water-soaked spots on leaves.',
    'A white, fuzzy mold may appear on the underside of leaves.',
    'Dark, greasy-looking lesions on stems.',
    'Fruits develop large, firm, brown spots.',
  ],
  organicTreatments: [
    'Ensure proper spacing for good air circulation.',
    'Apply copper-based fungicides as a preventative measure.',
    'Remove and destroy infected plant parts immediately.',
    'Water at the base of the plant to keep foliage dry.',
  ],
  chemicalTreatments: [
    'Apply fungicides containing mancozeb or chlorothalonil.',
    'Follow a regular spray schedule, especially during wet weather.',
    'Rotate fungicides to prevent resistance.',
  ],
};

// --- SVG Icons ---
const UploadIcon = () => (
  <svg
    className="w-12 h-12 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
    />
  </svg>
);

const LoadingSpinner = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        className="animate-spin h-12 w-12 text-green-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
          5.291A7.962 7.962 0 014 12H0c0 
          3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
        {t('analyzingPlant')}
      </p>
    </div>
  );
};

// --- Upload Section ---
const UploadSection = React.forwardRef(({ onImageUpload, t }, ref) => {
  const [imagePreview, setImagePreview] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        onImageUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  useImperativeHandle(ref, () => ({
    reset() {
      setImagePreview(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
  }));

  return (
    <div className="w-72 h-72 mx-auto">
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-300"
      >
        {!imagePreview ? (
          <>
            <UploadIcon />
            <p className="mt-3 text-base font-semibold text-gray-700 dark:text-gray-300">
              {t('uploadImage')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PNG, JPG, WEBP
            </p>
          </>
        ) : (
          <img
            src={imagePreview}
            alt="Preview"
            className="h-full w-full object-cover rounded-xl"
          />
        )}
      </label>
      <input
        id="file-upload"
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
});

// --- Results Section ---
const ResultsSection = ({ data, onReset, t }) => (
  <div className="space-y-8 animate-fadeIn">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
        {data.diseaseName}
      </h2>
      <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium mt-3 px-5 py-1.5 rounded-full">
        {t('confidence')}: {data.confidence}%
      </span>
    </div>

    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t('description')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {data.description}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t('commonSymptoms')}
          </h3>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
            {data.symptoms.map((symptom, idx) => (
              <li key={idx}>{symptom}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t('recommendedTreatments')}
          </h3>

          <div className="mt-3">
            <h4 className="font-semibold text-gray-600 dark:text-gray-400">
              {t('organicSolutions')}:
            </h4>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              {data.organicTreatments.map((treatment, idx) => (
                <li key={idx}>{treatment}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-gray-600 dark:text-gray-400">
              {t('chemicalSolutions')}:
            </h4>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              {data.chemicalTreatments.map((treatment, idx) => (
                <li key={idx}>{treatment}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <button
      onClick={onReset}
      className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300"
    >
      {t('analyzeAnotherPlant')}
    </button>
  </div>
);

// --- Main Component ---
export default function PestDetection() {
  const { t } = useLanguage();
  const [status, setStatus] = useState('upload');
  const [resultsData, setResultsData] = useState(null);
  const uploadRef = useRef();

  const handleImageUpload = useCallback((file) => {
    setStatus('loading');
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result; // e.g. "data:image/jpeg;base64,/9j/4AAQ..."
      const base64Data = dataUrl.split(',')[1]; // strip the "data:image/...;base64," prefix
      const mimeType = file.type || 'image/jpeg';
  
      try {
        const response = await fetch('http://localhost:5001/api/pest-detection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, mimeType }),
        });
  
        const data = await response.json();
  
        if (data.success && data.data) {
          setResultsData(data.data);
          setStatus('results');
        } else {
          console.error('Pest detection failed:', data.error);
          setStatus('upload');
          alert(data.error || 'Failed to analyze image. Please try again.');
        }
      } catch (error) {
        console.error('Error calling pest detection API:', error);
        setStatus('upload');
        alert('Failed to connect to server. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleReset = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.reset();
    }
    setStatus('upload');
    setResultsData(null);
  }, []);

  const GlobalStyles = () => {
    const style = `
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-in-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    return <style>{style}</style>;
  };

  return (
    <>
      <GlobalStyles />
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {t('pestDetection')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('pestDetectionDescription')}
          </p>
        </div>

        {status === 'upload' && (
          <UploadSection ref={uploadRef} onImageUpload={handleImageUpload} t={t} />
        )}
        {status === 'loading' && (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        )}
        {status === 'results' && (
          <ResultsSection data={resultsData} onReset={handleReset} t={t} />
        )}
      </div>
    </>
  );
}
