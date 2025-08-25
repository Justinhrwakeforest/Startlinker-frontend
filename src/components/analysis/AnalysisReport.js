import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, TrendingUp, Award, AlertCircle, 
  CheckCircle, ChevronDown, ChevronUp, Target, Lightbulb,
  BarChart3, Users, DollarSign, Zap
} from 'lucide-react';
import api from '../../services/api';
// Note: react-circular-progressbar needs to be installed: npm install react-circular-progressbar

const AnalysisReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSlides, setExpandedSlides] = useState(new Set());

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const response = await api.analysis.get(id);
      if (response.status !== 'completed') {
        navigate(`/analysis/${id}/processing`);
        return;
      }
      setAnalysis(response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      setError('Failed to load analysis report');
      setLoading(false);
    }
  };

  const toggleSlideExpansion = (slideNumber) => {
    const newExpanded = new Set(expandedSlides);
    if (newExpanded.has(slideNumber)) {
      newExpanded.delete(slideNumber);
    } else {
      newExpanded.add(slideNumber);
    }
    setExpandedSlides(newExpanded);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getSlideIcon = (topic) => {
    const iconMap = {
      'Problem': AlertCircle,
      'Solution': Lightbulb,
      'Market Size': BarChart3,
      'Team': Users,
      'Financial Projections': DollarSign,
      'Product': Zap,
      'Competition': Target,
      'Business Model': TrendingUp
    };
    return iconMap[topic] || Award;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">{error}</p>
          <button
            onClick={() => navigate('/deck-analyzer')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Analyzer
          </button>
        </div>
      </div>
    );
  }

  const result = analysis?.analysis_result || {};
  const overallSummary = result.overall_summary || {};
  const slideAnalysis = result.slide_by_slide_analysis || [];
  const missingElements = result.missing_elements || [];
  const investorReadiness = result.investor_readiness || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/deck-analyzer')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analyzer
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analysis Report
              </h1>
              <p className="text-gray-600">
                {analysis.original_filename}
              </p>
            </div>
            
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Score Circle */}
            <div className="text-center">
              <div className="w-40 h-40 mx-auto relative">
                {/* Custom circular progress */}
                <div className="w-40 h-40 rounded-full relative" style={{ 
                  background: `conic-gradient(${getScoreColor(overallSummary.score || 0)} ${(overallSummary.score || 0) * 3.6}deg, #e5e7eb 0deg)` 
                }}>
                  <div className="w-32 h-32 bg-white rounded-full absolute top-4 left-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{overallSummary.score || 0}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-gray-900">
                Overall Score
              </p>
              <p className="text-sm text-gray-600">Out of 100</p>
            </div>

            {/* Key Insights */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Key Strengths
                </h3>
                <p className="text-gray-700">{overallSummary.key_strengths}</p>
              </div>
              
              <div>
                <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                  Major Areas for Improvement
                </h3>
                <p className="text-gray-700">{overallSummary.major_weaknesses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investor Readiness */}
        {investorReadiness.score && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Investor Readiness: {investorReadiness.score}/10
                </h3>
                <p className="text-gray-700">{investorReadiness.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Missing Elements */}
        {missingElements.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              Missing Elements
            </h3>
            <p className="text-red-700 mb-4">
              Your pitch deck is missing these important components:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {missingElements.map((element, index) => (
                <div key={index} className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                  <span className="text-red-800">{element}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide-by-Slide Analysis */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Slide-by-Slide Analysis
          </h2>
          
          <div className="space-y-4">
            {slideAnalysis.map((slide) => {
              const SlideIcon = getSlideIcon(slide.identified_topic);
              const isExpanded = expandedSlides.has(slide.slide_number);
              
              return (
                <div
                  key={slide.slide_number}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleSlideExpansion(slide.slide_number)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <SlideIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">
                          Slide {slide.slide_number}: {slide.identified_topic}
                        </h4>
                        <div className="flex items-center mt-1 space-x-4 text-sm">
                          <span className="text-gray-600">
                            Design: {slide.design_score}/10
                          </span>
                          <span className="text-gray-600">
                            Clarity: {slide.clarity_score}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                          <p className="text-gray-700">{slide.feedback}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 text-amber-500 mr-2" />
                            Suggestion
                          </h5>
                          <p className="text-gray-700">{slide.suggestion}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600 mb-1">Design Score</p>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${slide.design_score * 10}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{slide.design_score}/10</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600 mb-1">Clarity Score</p>
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${slide.clarity_score * 10}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{slide.clarity_score}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/deck-analyzer')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Analyze Another Deck
          </button>
          <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Share Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;