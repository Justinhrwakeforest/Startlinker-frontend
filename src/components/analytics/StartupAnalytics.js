import React, { useState, useEffect } from 'react';
import './StartupAnalytics.css';

const StartupAnalytics = ({ startupId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  useEffect(() => {
    if (startupId) {
      fetchAnalytics();
    }
  }, [startupId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/startups/${startupId}/analytics/?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else if (response.status === 403) {
        setError('Access denied - unable to load analytics data');
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const renderMetricCard = (title, value, subtitle, icon, trend = null) => (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className="metric-info">
          <h4>{title}</h4>
          {trend && (
            <span className={`metric-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );

  const renderChart = (data, title, type = 'line') => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-container">
          <h4>{title}</h4>
          <div className="chart-placeholder">No data available</div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="chart">
          {data.map((point, index) => (
            <div key={index} className="chart-bar">
              <div 
                className="chart-bar-fill" 
                style={{ height: `${maxValue > 0 ? (point.value / maxValue) * 100 : 0}%` }}
              ></div>
              <div className="chart-label">{point.label}</div>
              <div className="chart-value">{point.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
      <div className="startup-analytics">
        <div className="analytics-header">
          <div className="analytics-title">
            <h2>Analytics Dashboard</h2>
          </div>
          
          <div className="analytics-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : error ? (
          <div className="analytics-error">
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : analytics ? (
          <div className="analytics-content">
            {/* Key Metrics */}
            <div className="metrics-grid">
              {renderMetricCard(
                'Views',
                formatNumber(analytics.views_total),
                `${analytics.views_today} today`,
                '👁️',
                analytics.views_trend
              )}
              
              {renderMetricCard(
                'Engagement Rate',
                formatPercentage(analytics.engagement_rate),
                'Likes, comments, bookmarks',
                '📊',
                analytics.engagement_trend
              )}
              
              {renderMetricCard(
                'Bookmarks',
                formatNumber(analytics.bookmarks_total),
                `${formatPercentage(analytics.bookmark_rate)} conversion`,
                '🔖',
                analytics.bookmarks_trend
              )}
              
              {renderMetricCard(
                'Average Rating',
                analytics.average_rating ? analytics.average_rating.toFixed(1) : 'N/A',
                `${analytics.total_ratings} ratings`,
                '⭐',
                analytics.rating_trend
              )}
              
              {renderMetricCard(
                'Comments',
                formatNumber(analytics.comments_total),
                'User feedback',
                '💬',
                analytics.comments_trend
              )}
              
              {renderMetricCard(
                'Trending Score',
                analytics.trending_score ? analytics.trending_score.toFixed(1) : '0',
                analytics.is_trending ? 'Trending now!' : 'Not trending',
                '🔥'
              )}
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-section">
                {renderChart(
                  analytics.daily_views,
                  'Daily Views',
                  'line'
                )}
              </div>
              
              <div className="chart-section">
                {renderChart(
                  analytics.engagement_breakdown,
                  'Engagement Breakdown',
                  'bar'
                )}
              </div>
            </div>

            {/* Geographic Data */}
            {analytics.top_countries && analytics.top_countries.length > 0 && (
              <div className="geographic-section">
                <h3>Geographic Insights</h3>
                <div className="geographic-grid">
                  <div className="geographic-card">
                    <h4>Top Countries</h4>
                    <div className="geographic-list">
                      {analytics.top_countries.slice(0, 5).map((country, index) => (
                        <div key={index} className="geographic-item">
                          <span className="country-name">{country.name}</span>
                          <span className="country-count">{country.count} views</span>
                          <div className="country-bar">
                            <div 
                              className="country-bar-fill" 
                              style={{ width: `${(country.count / analytics.top_countries[0].count) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {analytics.top_cities && analytics.top_cities.length > 0 && (
                    <div className="geographic-card">
                      <h4>Top Cities</h4>
                      <div className="geographic-list">
                        {analytics.top_cities.slice(0, 5).map((city, index) => (
                          <div key={index} className="geographic-item">
                            <span className="country-name">{city.name}</span>
                            <span className="country-count">{city.count} views</span>
                            <div className="country-bar">
                              <div 
                                className="country-bar-fill" 
                                style={{ width: `${(city.count / analytics.top_cities[0].count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="insights-section">
              <h3>Performance Insights</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <div className="insight-icon">🎯</div>
                  <div className="insight-content">
                    <h4>Conversion Rate</h4>
                    <p>{formatPercentage(analytics.conversion_rate)} of viewers take action</p>
                    <div className="insight-tip">
                      {analytics.conversion_rate > 10 
                        ? "Great conversion rate! Your content is engaging." 
                        : "Consider improving your startup description to increase engagement."}
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-icon">📈</div>
                  <div className="insight-content">
                    <h4>Growth Trend</h4>
                    <p>
                      {analytics.views_trend > 0 
                        ? `Growing by ${analytics.views_trend}% this period` 
                        : analytics.views_trend < 0 
                        ? `Declining by ${Math.abs(analytics.views_trend)}% this period`
                        : "Stable performance this period"}
                    </p>
                    <div className="insight-tip">
                      {analytics.views_trend > 0 
                        ? "Keep up the momentum!" 
                        : "Consider updating your startup information or adding new content."}
                    </div>
                  </div>
                </div>
                
                <div className="insight-card">
                  <div className="insight-icon">🌟</div>
                  <div className="insight-content">
                    <h4>Quality Score</h4>
                    <p>Rating: {analytics.average_rating ? `${analytics.average_rating.toFixed(1)}/5` : 'No ratings yet'}</p>
                    <div className="insight-tip">
                      {analytics.average_rating >= 4 
                        ? "Excellent rating! Users love your startup." 
                        : analytics.average_rating >= 3 
                        ? "Good rating, but there's room for improvement."
                        : "Focus on improving user satisfaction."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
  );
};

export default StartupAnalytics;