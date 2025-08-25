// src/components/StartupDetail.js - Complete file with claiming functionality and mobile responsiveness
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from '../services/api';
import ClaimStartupButton from './ClaimStartupButton';
import { useNotifications } from './NotificationSystem';
import { 
  ChevronLeft, MapPin, Users, Star, DollarSign, TrendingUp, 
  Briefcase, ExternalLink, Heart, Bookmark, MessageCircle, 
  Share2, ThumbsUp, Clock, Award, Building, Plus, 
  Globe, Calendar, Target, Shield, CheckCircle, Edit3, Trash2
} from "lucide-react";

export default function StartupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError, ratingSubmitted, bookmarkAdded } = useNotifications();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchStartupDetail();
    }
  }, [id]);

  const fetchStartupDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/startups/${id}/`);
      const startupData = response.data;
      
      setStartup(startupData);
      setIsBookmarked(startupData.is_bookmarked || false);
      setIsLiked(startupData.is_liked || false);
      setUserRating(startupData.user_rating || 0);
      
      console.log('Startup data loaded:', startupData);
    } catch (error) {
      console.error('Error fetching startup detail:', error);
      setError('Failed to load startup details');
      if (error.response?.status === 404) {
        navigate('/startups');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleEdit = () => {
    navigate(`/startups/${id}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/startups/${id}/`);
      success('Startup deleted successfully');
      // Navigate to startups list after successful deletion
      setTimeout(() => {
        navigate('/startups');
      }, 1000);
    } catch (error) {
      console.error('Error deleting startup:', error);
      showError(error.response?.data?.error || 'Failed to delete startup');
      setIsDeleting(false);
    }
  };

  const handleClaimUpdate = (claimData) => {
    // Refresh startup data when claim is updated
    fetchStartupDetail();
  };

  const handleRate = async (rating) => {
    if (submittingAction) return;
    
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('Please log in to rate this startup');
        navigate('/auth');
        return;
      }

      const response = await api.post(`/api/startups/${id}/rate/`, {
        rating: rating
      });
      
      setUserRating(rating);
      setStartup(prev => ({
        ...prev,
        average_rating: response.data.average_rating,
        total_ratings: response.data.total_ratings
      }));
      
      ratingSubmitted(startup.name, rating);
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.response?.status === 401) {
        showError('Please log in to rate this startup');
        navigate('/auth');
      } else {
        showError(error.response?.data?.error || 'Failed to submit rating. Please try again.');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleLike = async () => {
    if (submittingAction) return;
    
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('Please log in to like this startup');
        navigate('/auth');
        return;
      }

      const response = await api.post(`/api/startups/${id}/like/`);
      
      setIsLiked(response.data.liked);
      setStartup(prev => ({
        ...prev,
        total_likes: response.data.total_likes
      }));
      
      success(response.data.message);
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.response?.status === 401) {
        showError('Please log in to like this startup');
        navigate('/auth');
      } else {
        showError(error.response?.data?.error || 'Failed to update like. Please try again.');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBookmark = async () => {
    if (submittingAction) return;
    
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('Please log in to bookmark this startup');
        navigate('/auth');
        return;
      }

      const response = await api.post(`/api/startups/${id}/bookmark/`);
      
      setIsBookmarked(response.data.bookmarked);
      setStartup(prev => ({
        ...prev,
        total_bookmarks: response.data.total_bookmarks
      }));
      
      bookmarkAdded(startup.name);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      if (error.response?.status === 401) {
        showError('Please log in to bookmark this startup');
        navigate('/auth');
      } else {
        showError(error.response?.data?.error || 'Failed to update bookmark. Please try again.');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submittingAction) return;
    
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('Please log in to comment');
        navigate('/auth');
        return;
      }

      const response = await api.post(`/api/startups/${id}/comment/`, {
        text: comment
      });
      
      setStartup(prev => ({
        ...prev,
        recent_comments: [response.data.comment, ...(prev.recent_comments || [])],
        total_comments: (prev.total_comments || 0) + 1
      }));
      
      setComment('');
      success('Comment posted successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      if (error.response?.status === 401) {
        showError('Please log in to comment');
        navigate('/auth');
      } else {
        showError(error.response?.data?.error || 'Failed to submit comment. Please try again.');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const StarRating = ({ rating, onRate, interactive = false }) => {
    return (
      <div className="flex items-center justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            disabled={!interactive || submittingAction}
            className={`transition-all duration-200 ${
              interactive 
                ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded' 
                : 'cursor-default'
            }`}
          >
            <Star 
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                star <= rating 
                  ? 'text-amber-400 fill-amber-400' 
                  : interactive 
                    ? 'text-slate-300 hover:text-amber-300' 
                    : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'metrics', label: 'Metrics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-ping"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading startup details</h3>
          <p className="text-slate-500">Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Startup not found</h3>
          <p className="text-slate-600 mb-6">The startup you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/startups"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Startups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Error Message Toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg mx-auto max-w-md sm:left-auto sm:mx-0 sm:right-4 sm:max-w-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/startups"
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm sm:text-base">Back to Startups</span>
            </Link>
            
            {/* Mobile Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Claim Button */}
              <div className="hidden sm:block">
                <ClaimStartupButton 
                  startup={startup}
                  userClaimRequest={startup.user_claim_request}
                  onClaimUpdate={handleClaimUpdate}
                />
              </div>

              {/* Edit Button - Only show if user can edit */}
              {startup.can_edit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200 font-medium text-sm"
                >
                  <Edit3 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Startup</span>
                </button>
              )}

              {/* Delete Button - Only show for admins */}
              {startup.can_delete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200 font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}

              <button
                onClick={handleBookmark}
                disabled={submittingAction}
                className={`flex items-center px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg border font-medium transition-all duration-200 text-sm ${
                  isBookmarked
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                } ${submittingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Bookmark className={`w-4 h-4 sm:mr-2 ${isBookmarked ? 'fill-blue-700' : ''}`} />
                <span className="hidden sm:inline">{submittingAction ? 'Saving...' : (isBookmarked ? 'Saved' : 'Save')}</span>
              </button>
              
              <button
                onClick={handleLike}
                disabled={submittingAction}
                className={`flex items-center px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg border font-medium transition-all duration-200 text-sm ${
                  isLiked
                    ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                } ${submittingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`w-4 h-4 sm:mr-2 ${isLiked ? 'fill-red-700' : ''}`} />
                <span className="text-xs sm:text-sm">{startup.total_likes || 0}</span>
              </button>
              
              <button className="flex items-center px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium text-sm">
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Claim Button */}
          <div className="sm:hidden mt-3">
            <ClaimStartupButton 
              startup={startup}
              userClaimRequest={startup.user_claim_request}
              onClaimUpdate={handleClaimUpdate}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Professional Startup Header with Cover Image */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 mb-6 sm:mb-8">
          {/* Enhanced Header Background with Cover Image */}
          <div className="h-48 sm:h-64 relative overflow-hidden rounded-t-2xl">
            {startup.cover_image_display_url ? (
              <div className="relative h-full">
                <img 
                  src={startup.cover_image_display_url}
                  alt={`${startup.name} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
                  <div className="flex items-end justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 sm:border-4 border-white flex items-center justify-center text-2xl sm:text-3xl font-bold relative">
                        {startup.logo}
                        {startup.is_featured && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 rounded-full flex items-center justify-center">
                            <Award className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">{startup.name}</h1>
                          <div className="flex flex-wrap gap-2">
                            {startup.is_featured && (
                              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                <Award className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Featured
                              </span>
                            )}
                            {/* Claimed Badge */}
                            {startup.is_claimed && startup.claim_verified && (
                              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                          <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/90 backdrop-blur-sm text-slate-800 border border-white/20">
                            {startup.industry_detail?.icon} {startup.industry_detail?.name}
                          </span>
                          <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {startup.location}
                          </div>
                          <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Founded {startup.founded_year}
                          </div>
                          {startup.is_claimed && startup.claim_verified && (
                            <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Claimed by {startup.claimed_by_username}
                            </div>
                          )}
                        </div>
                        <p className="text-white/95 text-sm sm:text-lg leading-relaxed drop-shadow max-w-full break-all overflow-hidden text-ellipsis"
                           style={{
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             wordBreak: 'break-all',
                             overflowWrap: 'anywhere'
                           }}>
                          {startup.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
                
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
                  <div className="flex items-end justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 sm:border-4 border-white flex items-center justify-center text-2xl sm:text-3xl font-bold relative">
                        {startup.logo}
                        {startup.is_featured && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 rounded-full flex items-center justify-center">
                            <Award className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">{startup.name}</h1>
                          <div className="flex flex-wrap gap-2">
                            {startup.is_featured && (
                              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                <Award className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Featured
                              </span>
                            )}
                            {/* Claimed Badge */}
                            {startup.is_claimed && startup.claim_verified && (
                              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-xs sm:text-sm font-semibold flex items-center shadow-lg">
                                <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                          <span className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/90 backdrop-blur-sm text-slate-800 border border-white/20">
                            {startup.industry_detail?.icon} {startup.industry_detail?.name}
                          </span>
                          <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {startup.location}
                          </div>
                          <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Founded {startup.founded_year}
                          </div>
                          {startup.is_claimed && startup.claim_verified && (
                            <div className="flex items-center text-white/90 font-medium drop-shadow text-xs sm:text-sm">
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Claimed by {startup.claimed_by_username}
                            </div>
                          )}
                        </div>
                        <p className="text-white/95 text-sm sm:text-lg leading-relaxed drop-shadow max-w-4xl line-clamp-3 sm:line-clamp-none">{startup.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Content area with rating card */}
          <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
            {/* Rating Card - Mobile: Full width below header, Desktop: Floating right */}
            <div className="lg:absolute lg:top-0 lg:right-8 lg:transform lg:-translate-y-1/2 lg:z-10 mt-4 lg:mt-0">
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg w-full lg:min-w-[280px]">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="flex items-baseline justify-center space-x-1 mb-2 sm:mb-3">
                    <div className="text-2xl sm:text-4xl font-bold text-slate-900">
                      {startup.average_rating?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm sm:text-lg text-slate-500 font-medium">/5.0</div>
                  </div>
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <StarRating rating={Math.round(startup.average_rating || 0)} />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    {startup.total_ratings || 0} {(startup.total_ratings === 1) ? 'review' : 'reviews'}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 sm:pt-6 mb-4 sm:mb-6">
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-3 sm:mb-4 text-center">Rate this startup</div>
                  <div className="flex justify-center">
                    <StarRating 
                      rating={userRating} 
                      onRate={handleRate}
                      interactive={true}
                    />
                  </div>
                  {userRating > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-slate-500">You rated: {userRating}/5</span>
                    </div>
                  )}
                </div>

                {startup.website && (
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                  >
                    <Globe className="w-4 h-4 mr-2" /> Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="pt-4 sm:pt-16 lg:pr-72">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-slate-200">
                <div className="text-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-900 mb-1">{startup.employee_count || '10+'}</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">Employees</div>
                </div>
                
                <div className="text-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Building className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-900 mb-1">{startup.founded_year || '2020'}</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">Founded</div>
                </div>
                
                <div className="text-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">{startup.funding_amount || 'Seed'}</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">Funding</div>
                </div>
                
                <div className="text-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Target className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-amber-600 mb-1">{startup.valuation || startup.views || '1K+'}</div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">{startup.valuation ? 'Valuation' : 'Views'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 mb-6 sm:mb-8 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex px-2 sm:px-6 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 sm:py-4 px-3 sm:px-6 border-b-3 font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-1 sm:mr-2">{tab.icon}</span>
                  {tab.label} 
                  {tab.id === 'jobs' && startup.open_jobs?.length > 0 && (
                    <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                      {startup.open_jobs.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">About {startup.name}</h3>
                  
                  {/* Claim Status Information */}
                  {startup.is_claimed && startup.claim_verified && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start sm:items-center">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
                        <div>
                          <p className="text-green-800 font-medium text-sm sm:text-base">
                            This company profile has been claimed and verified by {startup.claimed_by_username}
                          </p>
                          <p className="text-green-600 text-xs sm:text-sm mt-1">
                            Information on this page is maintained by the company representative.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="prose max-w-none text-slate-700 leading-relaxed">
                    <p className="text-base sm:text-lg whitespace-pre-wrap break-words overflow-hidden">
                      {startup.description}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                      Company Details
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      {startup.revenue && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                          <span className="text-slate-600 font-medium text-sm sm:text-base">Annual Revenue</span>
                          <span className="font-semibold text-slate-900 text-sm sm:text-base">{startup.revenue}</span>
                        </div>
                      )}
                      {startup.user_count && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                          <span className="text-slate-600 font-medium text-sm sm:text-base">Active Users</span>
                          <span className="font-semibold text-slate-900 text-sm sm:text-base">{startup.user_count}</span>
                        </div>
                      )}
                      {startup.growth_rate && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                          <span className="text-slate-600 font-medium text-sm sm:text-base">Growth Rate</span>
                          <span className="font-semibold text-green-600 flex items-center text-sm sm:text-base">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {startup.growth_rate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Technologies & Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {startup.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {tag.tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {startup.similar_startups && startup.similar_startups.length > 0 && (
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Similar Companies</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {startup.similar_startups.map((similar) => (
                        <Link
                          key={similar.id}
                          to={`/startups/${similar.id}`}
                          className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center text-lg sm:text-xl font-semibold flex-shrink-0">
                              {similar.logo}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate">{similar.name}</h5>
                              <p className="text-xs sm:text-sm text-slate-600 truncate">{similar.industry_name}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-3 sm:space-y-0">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Open Positions</h3>
                    <p className="text-slate-600 mt-1 text-sm sm:text-base">Join our growing team and make an impact</p>
                  </div>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-3 sm:px-4 py-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors text-sm sm:text-base"
                  >
                    View All Jobs
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Link>
                </div>
                
                {startup.open_jobs?.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {startup.open_jobs.map((job) => (
                      <div key={job.id} className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 group">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
                              <div className="flex-1">
                                <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                                  <span className="flex items-center font-medium">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {job.location}
                                  </span>
                                  {job.salary_range && (
                                    <span className="flex items-center font-medium">
                                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {job.salary_range}
                                    </span>
                                  )}
                                  <span className="flex items-center font-medium">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {job.posted_ago}
                                  </span>
                                </div>
                              </div>
                              <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap text-sm sm:text-base w-full sm:w-auto sm:ml-4">
                                Apply Now
                              </button>
                            </div>
                            
                            <p className="text-slate-700 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{job.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {job.job_type_name}
                              </span>
                              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                {job.experience_level_display}
                              </span>
                              {job.is_remote && (
                                <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Remote
                                </span>
                              )}
                            </div>
                            
                            {job.skills_list && job.skills_list.length > 0 && (
                              <div className="pt-3 sm:pt-4 border-t border-slate-200">
                                <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">Required Skills:</div>
                                <div className="flex flex-wrap gap-2">
                                  {job.skills_list.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-dashed border-slate-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No open positions</h4>
                    <p className="text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">We're not actively hiring right now, but we're always looking for exceptional talent.</p>
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base">
                      Get Notified of New Positions
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Meet the Team</h3>
                  <p className="text-slate-600 text-sm sm:text-base">The people behind {startup.name}</p>
                </div>
                
                {startup.founders?.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {startup.founders.map((founder) => (
                      <div key={founder.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 group">
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            <div className="flex-shrink-0 self-center sm:self-start">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
                                {founder.name.charAt(0)}
                              </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{founder.name}</h4>
                              <p className="text-blue-600 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{founder.title}</p>
                              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{founder.bio}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-dashed border-slate-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Team information coming soon</h4>
                    <p className="text-slate-600 text-sm sm:text-base">We're working on adding detailed team information.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Engagement Metrics</h3>
                  <p className="text-slate-600 text-sm sm:text-base">Community interaction and engagement data</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{startup.total_likes || 0}</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-semibold">Likes</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{startup.total_bookmarks || 0}</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-semibold">Bookmarks</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{startup.total_comments || 0}</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-semibold">Comments</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-1">{startup.views || 0}</div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">Views</div>
                  </div>
                </div>

                {/* Recent Activity Section */}
                {startup.engagement_metrics && (
                  <div className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Recent Activity (30 Days)</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{startup.engagement_metrics.recent_ratings}</div>
                        <div className="text-xs sm:text-sm text-slate-600">New Ratings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">{startup.engagement_metrics.recent_comments}</div>
                        <div className="text-xs sm:text-sm text-slate-600">New Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-red-600">{startup.engagement_metrics.recent_likes}</div>
                        <div className="text-xs sm:text-sm text-slate-600">New Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{startup.engagement_metrics.recent_bookmarks}</div>
                        <div className="text-xs sm:text-sm text-slate-600">New Bookmarks</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-slate-600">Engagement Trend:</span>
                        <span className={`text-xs sm:text-sm font-semibold ${
                          startup.engagement_metrics.engagement_change_percent >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {startup.engagement_metrics.engagement_change_percent >= 0 ? '↗' : '↘'} 
                          {Math.abs(startup.engagement_metrics.engagement_change_percent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Reviews & Comments</h3>
                  <p className="text-slate-600 text-sm sm:text-base">Share your experience and read what others think</p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 sm:p-8">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Share Your Thoughts
                  </h4>
                  <form onSubmit={handleComment}>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this startup, ask questions, or provide insights..."
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-500 leading-relaxed text-sm sm:text-base"
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 sm:mt-4 space-y-3 sm:space-y-0">
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">{comment.length}/1000 characters</span>
                      <button
                        type="submit"
                        disabled={!comment.trim() || submittingAction}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
                      >
                        {submittingAction ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Publishing...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {startup.recent_comments?.length > 0 ? (
                    startup.recent_comments.map((comment) => (
                      <div key={comment.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm sm:text-lg">
                              {comment.user_first_name?.charAt(0) || comment.user_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 text-sm sm:text-base">
                              {comment.user_display_name || comment.user_first_name || comment.user_name || 'Anonymous'}
                            </div>
                            {comment.user_name && (comment.user_first_name || comment.user_last_name) && (
                              <div className="text-xs text-blue-600 font-medium">
                                @{comment.user_name}
                              </div>
                            )}
                            <div className="text-xs sm:text-sm text-slate-500 flex items-center font-medium">
                              <Clock className="w-3 h-3 mr-1" /> {comment.time_ago}
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{comment.text}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-slate-500">
                            <button className="flex items-center hover:text-blue-600 transition-colors font-medium">
                              <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button className="hover:text-blue-600 transition-colors font-medium">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-dashed border-slate-300">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No comments yet</h4>
                      <p className="text-slate-600 max-w-md mx-auto text-sm sm:text-base px-4">Be the first to share your thoughts about this startup!</p>
                    </div>
                  )}
                </div>
                
                {startup.recent_comments?.length > 0 && (
                  <div className="text-center">
                    <button className="px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 text-sm sm:text-base">
                      Load More Comments
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">
                Delete Startup
              </h3>
              <p className="text-slate-600 text-center text-sm sm:text-base">
                Are you sure you want to delete "{startup.name}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Startup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}