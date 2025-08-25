import React, { useState, useEffect, useContext } from 'react';
import { Bookmark, Building2, Briefcase, FileText, Calendar, MapPin, DollarSign, Users, Eye, Heart, MessageCircle, TrendingUp, Clock, MoreHorizontal, ExternalLink, Star, Loader } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAvatarUrl, getUserDisplayName } from '../utils/avatarUtils';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Bookmarks() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarkedStartups, setBookmarkedStartups] = useState([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user, activeTab]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'posts':
          await loadBookmarkedPosts();
          break;
        case 'startups':
          await loadBookmarkedStartups();
          break;
        case 'jobs':
          await loadBookmarkedJobs();
          break;
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkedPosts = async () => {
    try {
      // First try to fetch from API
      console.log('🔍 Loading bookmarked posts for user:', user?.username);
      console.log('🔍 Auth token exists:', !!localStorage.getItem('auth_token'));
      
      let apiPosts = [];
      try {
        const response = await api.get('/api/posts/posts/bookmarks/');
        console.log('📝 Posts bookmarks response:', response.data);
        apiPosts = response.data.results || response.data || [];
      } catch (apiError) {
        console.warn('⚠️ API fetch failed, will use localStorage fallback:', apiError.message);
      }
      
      // Get bookmarks from localStorage
      const userBookmarksKey = user?.id ? `userBookmarks_user_${user.id}` : 'userBookmarks';
      const localBookmarks = JSON.parse(localStorage.getItem(userBookmarksKey) || '{}');
      const bookmarkedPostIds = Object.keys(localBookmarks).filter(postId => localBookmarks[postId]);
      
      console.log('📝 Local bookmarked post IDs:', bookmarkedPostIds);
      
      // If we have local bookmarks but no API posts, try to fetch the actual post data
      if (bookmarkedPostIds.length > 0 && apiPosts.length === 0) {
        console.log('📝 Fetching post details for local bookmarks...');
        
        // Fetch all posts and filter by bookmarked IDs
        try {
          const allPostsResponse = await api.posts.list({ limit: 100 });
          const allPosts = allPostsResponse.results || [];
          
          // Filter posts that are bookmarked
          const localBookmarkedPosts = allPosts.filter(post => bookmarkedPostIds.includes(post.id));
          
          console.log('📝 Found', localBookmarkedPosts.length, 'bookmarked posts from', allPosts.length, 'total posts');
          setBookmarkedPosts(localBookmarkedPosts);
        } catch (fetchError) {
          console.error('❌ Error fetching posts:', fetchError);
          setBookmarkedPosts([]);
        }
      } else {
        // Use API posts if available
        console.log('📝 Using API posts:', apiPosts.length);
        setBookmarkedPosts(apiPosts);
      }
    } catch (error) {
      console.error('❌ Error loading bookmarked posts:', error);
      setBookmarkedPosts([]);
    }
  };

  const loadBookmarkedStartups = async () => {
    try {
      // Fetch bookmarked startups using existing endpoint
      const response = await api.startups.list({ bookmarked: true });
      setBookmarkedStartups(response.results || []);
    } catch (error) {
      console.error('Error loading bookmarked startups:', error);
      // Try direct API call as fallback
      try {
        const fallbackResponse = await api.get('/api/startups/bookmarked/');
        setBookmarkedStartups(fallbackResponse.data.results || fallbackResponse.data || []);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setBookmarkedStartups([]);
      }
    }
  };

  const loadBookmarkedJobs = async () => {
    try {
      // Fetch bookmarked jobs using correct endpoint
      console.log('🔍 Loading bookmarked jobs for user:', user?.username);
      const response = await api.get('/api/jobs/bookmarks/');
      console.log('💼 Jobs bookmarks response:', response.data);
      console.log('💼 Response status:', response.status);
      
      const jobs = response.data.results || response.data || [];
      
      // Filter out expired jobs from bookmarks
      const activeJobs = jobs.filter(bookmark => {
        const job = bookmark.job || bookmark;
        return job.status !== 'expired';
      });
      
      console.log('💼 Total jobs fetched:', jobs.length);
      console.log('💼 Active jobs after filtering expired:', activeJobs.length);
      setBookmarkedJobs(activeJobs);
    } catch (error) {
      console.error('❌ Error loading bookmarked jobs:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Full error:', error.message);
      setBookmarkedJobs([]);
    }
  };

  const handleRemovePostBookmark = async (postId) => {
    try {
      // Remove from localStorage
      const userBookmarksKey = user?.id ? `userBookmarks_user_${user.id}` : 'userBookmarks';
      const userBookmarks = JSON.parse(localStorage.getItem(userBookmarksKey) || '{}');
      userBookmarks[postId] = false;
      localStorage.setItem(userBookmarksKey, JSON.stringify(userBookmarks));
      
      // Try to remove from API as well
      try {
        await api.posts.bookmark(postId);
      } catch (apiError) {
        console.warn('API bookmark removal failed, but local removal succeeded:', apiError);
      }
      
      // Update UI
      setBookmarkedPosts(prev => prev.filter(item => 
        item.post ? item.post.id !== postId : item.id !== postId
      ));
    } catch (error) {
      console.error('Error removing post bookmark:', error);
    }
  };

  const handleRemoveStartupBookmark = async (startupId) => {
    try {
      await api.startups.toggleBookmark(startupId);
      setBookmarkedStartups(prev => prev.filter(item => 
        item.startup ? item.startup.id !== startupId : item.id !== startupId
      ));
    } catch (error) {
      console.error('Error removing startup bookmark:', error);
    }
  };

  const handleRemoveJobBookmark = async (jobId) => {
    try {
      // Use DELETE method to remove bookmark
      await api.delete(`/api/jobs/${jobId}/bookmark/`);
      setBookmarkedJobs(prev => prev.filter(item => 
        item.job ? item.job.id !== jobId : item.id !== jobId
      ));
      console.log('Job bookmark removed');
    } catch (error) {
      console.error('Error removing job bookmark:', error);
    }
  };

  const PostBookmarkCard = ({ bookmark }) => {
    const post = bookmark.post || bookmark;
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/posts`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img
              src={getAvatarUrl(post.author, 40)}
              alt={post.author?.display_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h4 className="font-medium text-gray-900">{post.author?.display_name || 'Anonymous'}</h4>
              <p className="text-xs text-gray-500">{post.time_since || 'Recently'}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when removing bookmark
              handleRemovePostBookmark(post.id);
            }}
            className="text-gray-400 hover:text-gray-600"
            title="Remove bookmark"
          >
            <Bookmark className="w-5 h-5 fill-current" />
          </button>
        </div>
        
        <div>
          {post.title && (
            <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600">{post.title}</h3>
          )}
          <p className="text-gray-600 text-sm line-clamp-3">
            {post.content_preview || post.content}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{post.view_count || 0}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{post.like_count || 0}</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{post.comment_count || 0}</span>
          </span>
        </div>
      </div>
    );
  };

  const StartupBookmarkCard = ({ bookmark }) => {
    // For startups, the data is returned directly (not wrapped in bookmark object)
    const startup = bookmark.startup || bookmark;
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/startups/${startup.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">
                {startup.name}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when removing bookmark
                  handleRemoveStartupBookmark(startup.id);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Remove bookmark"
              >
                <Bookmark className="w-5 h-5 fill-current" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">{startup.tagline}</p>
          </div>
        </div>
        
        {startup.cover_image && (
          <img
            src={startup.cover_image}
            alt={startup.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
        )}
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {startup.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {startup.industries?.slice(0, 3).map((industry, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {industry.name || industry}
            </span>
          ))}
          {startup.industry_name && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {startup.industry_name}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{startup.location || 'Remote'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{startup.founded_date || 'N/A'}</span>
          </span>
        </div>
        
        {/* Rating and engagement */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{startup.average_rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-xs text-gray-500">({startup.total_ratings || 0} reviews)</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <span className="flex items-center text-xs">
              <Heart className="w-3 h-3 mr-1" />
              {startup.total_likes || 0}
            </span>
            <span className="flex items-center text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              {startup.total_comments || 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const JobBookmarkCard = ({ bookmark }) => {
    const job = bookmark.job || bookmark;
    
    // Check if job is expiring soon
    const getExpiryStatus = () => {
      if (!job.expires_at) return null;
      
      const now = new Date();
      const expiryDate = new Date(job.expires_at);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 0) {
        return { type: 'expired', message: 'Expired', color: 'bg-red-100 text-red-800' };
      } else if (daysUntilExpiry <= 3) {
        return { type: 'expiring', message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`, color: 'bg-orange-100 text-orange-800' };
      } else if (daysUntilExpiry <= 7) {
        return { type: 'warning', message: `Expires in ${daysUntilExpiry} days`, color: 'bg-yellow-100 text-yellow-800' };
      }
      return null;
    };
    
    const expiryStatus = getExpiryStatus();
    
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/jobs/${job.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">
                {job.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when removing bookmark
                  handleRemoveJobBookmark(job.id);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Remove bookmark"
              >
                <Bookmark className="w-5 h-5 fill-current" />
              </button>
            </div>
            <p className="text-sm text-blue-600 mt-1">{job.company_name}</p>
            
            {/* Expiry status indicator */}
            {expiryStatus && (
              <div className="mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${expiryStatus.color}`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {expiryStatus.message}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
          <span className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location || 'Remote'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Briefcase className="w-4 h-4" />
            <span>{job.job_type || 'Full-time'}</span>
          </span>
          <span className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>{job.salary_range || 'Competitive'}</span>
          </span>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {job.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {job.skills?.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            Posted {job.posted_date || 'recently'}
          </span>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view bookmarks</h2>
          <p className="text-gray-600 mb-4">Keep track of your favorite posts, startups, and jobs</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
          <p className="text-gray-600 mt-1">Save and organize your favorite content</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Posts</span>
                {bookmarkedPosts.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {bookmarkedPosts.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('startups')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'startups'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Startups</span>
                {bookmarkedStartups.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {bookmarkedStartups.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Jobs</span>
                {bookmarkedJobs.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {bookmarkedJobs.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'posts' && (
              bookmarkedPosts.length > 0 ? (
                bookmarkedPosts.map((bookmark, idx) => (
                  <PostBookmarkCard key={bookmark.id || idx} bookmark={bookmark} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked posts yet</h3>
                  <p className="text-gray-600">Start bookmarking posts to save them for later</p>
                </div>
              )
            )}
            
            {activeTab === 'startups' && (
              bookmarkedStartups.length > 0 ? (
                bookmarkedStartups.map((bookmark, idx) => (
                  <StartupBookmarkCard key={bookmark.id || idx} bookmark={bookmark} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked startups yet</h3>
                  <p className="text-gray-600">Discover and bookmark startups you're interested in</p>
                </div>
              )
            )}
            
            {activeTab === 'jobs' && (
              bookmarkedJobs.length > 0 ? (
                bookmarkedJobs.map((bookmark, idx) => (
                  <JobBookmarkCard key={bookmark.id || idx} bookmark={bookmark} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked jobs yet</h3>
                  <p className="text-gray-600">Save job opportunities you want to apply for</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Custom CSS for line clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}