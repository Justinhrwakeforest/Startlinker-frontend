import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DeckUpload from '../components/analysis/DeckUpload';
import AnalysisList from '../components/analysis/AnalysisList';
import { Sparkles, Lock, TrendingUp, Award, Target, CheckCircle } from 'lucide-react';

const DeckAnalyzerPage = () => {
  const navigate = useNavigate();
  const [featureInfo, setFeatureInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    loadFeatureInfo();
  }, []);

  const loadFeatureInfo = async () => {
    try {
      const data = await api.analysis.getFeatureInfo();
      setFeatureInfo(data);
      
      if (data.is_pro) {
        loadAnalyses();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load feature info:', error);
      setLoading(false);
    }
  };

  const loadAnalyses = async () => {
    try {
      const data = await api.analysis.list();
      setAnalyses(data.results || data);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    }
  };

  const handleUploadSuccess = (analysisId) => {
    navigate(`/analysis/${analysisId}/processing`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Landing page for non-pro users
  if (!featureInfo?.is_pro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Pitch Deck Analysis
            </h1>
            <p className="text-xl text-gray-600">
              Get instant, actionable feedback on your pitch deck from our AI analyst
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What You'll Get
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: Target,
                  title: 'Slide-by-Slide Analysis',
                  description: 'Detailed feedback for each slide with specific improvements'
                },
                {
                  icon: TrendingUp,
                  title: 'Investor Readiness Score',
                  description: 'Overall assessment of how ready your deck is for investors'
                },
                {
                  icon: Award,
                  title: 'Design & Clarity Ratings',
                  description: 'Professional evaluation of visual design and message clarity'
                },
                {
                  icon: CheckCircle,
                  title: 'Missing Elements',
                  description: 'Identify crucial components that may be missing from your deck'
                }
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <benefit.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Upgrade to Founder Pro
            </h3>
            <p className="text-white/90 mb-6">
              Unlock AI-powered pitch deck analysis and other premium features
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pro user interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pitch Deck Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your pitch deck to get AI-powered feedback and insights
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DeckUpload onUploadSuccess={handleUploadSuccess} />
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Analyses
              </h2>
              <AnalysisList 
                analyses={analyses} 
                onAnalysisClick={(id) => navigate(`/analysis/${id}`)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckAnalyzerPage;