import React, { useState, useEffect } from 'react';
import { Hash, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../services/api';

const TrendingTopics = ({ selectedTopic, onTopicSelect, className = "" }) => {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to get trending topics
      const response = await api.get('/api/posts/topics/trending/');
      
      // Process the response data
      const topics = response.data.map(topic => ({
        id: topic.id,
        name: topic.name,
        icon: topic.icon || getDefaultIcon(topic.name),
        count: topic.post_count || 0,
        follower_count: topic.follower_count || 0,
        slug: topic.slug
      }));
      
      setTrendingTopics(topics);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setError('Failed to load trending topics');
      
      // Fallback to default topics if API fails
      setTrendingTopics([
        { id: 1, name: 'startup', icon: '🚀', count: 156 },
        { id: 2, name: 'fundraising', icon: '💰', count: 89 },
        { id: 3, name: 'growth', icon: '📈', count: 124 },
        { id: 4, name: 'hiring', icon: '👥', count: 67 },
        { id: 5, name: 'product', icon: '📱', count: 103 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultIcon = (topicName) => {
    const iconMap = {
      'startup': '🚀',
      'fundraising': '💰',
      'growth': '📈',
      'hiring': '👥',
      'product': '📱',
      'technology': '💻',
      'ai': '🤖',
      'marketing': '📊',
      'business': '💼',
      'innovation': '💡',
      'networking': '🤝',
      'investment': '💎',
      'saas': '☁️',
      'mobile': '📱',
      'web': '🌐',
      'design': '🎨',
      'development': '⚙️',
      'fintech': '💳',
      'healthtech': '🏥',
      'edtech': '📚'
    };
    
    return iconMap[topicName.toLowerCase()] || '#️⃣';
  };

  const handleRefresh = () => {
    fetchTrendingTopics();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 mb-6 border border-gray-100 shadow-sm ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Trending Topics
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 mb-6 border border-gray-100 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Trending Topics
        </h3>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh trending topics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <button
            key={topic.id}
            onClick={() => onTopicSelect && onTopicSelect(selectedTopic === topic.name ? null : topic.name)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              selectedTopic === topic.name
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-800 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl" role="img" aria-label={topic.name}>
                {topic.icon}
              </span>
              <div className="text-left">
                <span className="font-medium">#{topic.name}</span>
                {topic.follower_count > 0 && (
                  <p className={`text-xs ${
                    selectedTopic === topic.name ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {topic.follower_count} followers
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedTopic === topic.name
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {topic.count}
              </span>
              {index < 3 && (
                <div className={`w-2 h-2 rounded-full ${
                  index === 0 ? 'bg-yellow-400' :
                  index === 1 ? 'bg-gray-400' :
                  'bg-orange-400'
                }`} title={`#${index + 1} trending`} />
              )}
            </div>
          </button>
        ))}
      </div>
      
      {trendingTopics.length === 0 && !loading && (
        <div className="text-center py-8">
          <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No trending topics available</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Try refreshing
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;