import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, Sparkles, TrendingUp, Target, Brain } from 'lucide-react';
import api from '../../services/api';

const AnalysisProcessing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [currentMessage, setCurrentMessage] = useState(0);
  const [error, setError] = useState('');

  const processingMessages = [
    { icon: Brain, text: "Analyzing your pitch deck structure..." },
    { icon: Target, text: "Evaluating your value proposition..." },
    { icon: TrendingUp, text: "Checking your market analysis..." },
    { icon: Sparkles, text: "Reviewing your team presentation..." },
    { icon: Brain, text: "Assessing investor readiness..." },
    { icon: Target, text: "Generating actionable insights..." }
  ];

  useEffect(() => {
    // Start polling for analysis status
    const pollInterval = setInterval(checkAnalysisStatus, 5000);
    
    // Rotate messages
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % processingMessages.length);
    }, 3000);

    // Initial check
    checkAnalysisStatus();

    return () => {
      clearInterval(pollInterval);
      clearInterval(messageInterval);
    };
  }, [id]);

  const checkAnalysisStatus = async () => {
    try {
      const response = await api.analysis.get(id);
      
      if (response.status === 'completed') {
        // Navigate to the report page
        navigate(`/analysis/${id}`, { replace: true });
      } else if (response.status === 'failed') {
        setStatus('failed');
        setError(response.error_message || 'Analysis failed. Please try again.');
      } else {
        setStatus(response.status);
      }
    } catch (error) {
      console.error('Failed to check analysis status:', error);
      if (error.response?.status === 404) {
        setError('Analysis not found');
        setStatus('failed');
      }
    }
  };

  const handleRetry = () => {
    navigate('/deck-analyzer');
  };

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const CurrentIcon = processingMessages[currentMessage].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {/* Animated Icon */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <CurrentIcon className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Analyzing Your Pitch Deck
            </h1>

            {/* Processing Message */}
            <div className="mb-8 h-12 flex items-center justify-center">
              <p className="text-lg text-gray-600 animate-fade-in">
                {processingMessages[currentMessage].text}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex justify-center space-x-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === currentMessage
                        ? 'w-8 bg-blue-600'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center mb-6">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>

            {/* Info Text */}
            <p className="text-sm text-gray-500">
              This typically takes 1-2 minutes. You'll be redirected automatically when complete.
            </p>
          </div>
        </div>

        {/* Tips While Waiting */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Did you know?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              Our AI analyzes over 50 different aspects of your pitch deck
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              We compare your deck against successful funding patterns
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              You'll receive specific, actionable feedback for each slide
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProcessing;