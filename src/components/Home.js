// src/components/Home.js - Fixed welcome page with proper navigation
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from './Logo';
import { 
  Search, ChevronDown, ChevronRight, Filter, MapPin, 
  Briefcase, Building, Users, Rocket, Zap, Award, 
  DollarSign, TrendingUp, ArrowRight, Star, Calendar
} from "lucide-react";
import { useAuth } from '../context/AuthContext';

// Helper function to get industry icons
const getIndustryIcon = (industryName) => {
  const iconMap = {
    'FinTech': '💰',
    'HealthTech': '🏥',
    'EdTech': '📚',
    'AI/ML': '🤖',
    'CleanTech': '🌱',
    'E-commerce': '🛒',
    'SaaS': '💻',
    'Blockchain': '⛓️',
    'IoT': '🌐',
    'Gaming': '🎮',
    'Social Media': '👥',
    'Transportation': '🚗',
    'Food & Beverage': '🍕',
    'Real Estate': '🏠',
    'Fashion': '👗',
    'Entertainment': '🎬',
    'Energy': '⚡',
    'Agriculture': '🌾',
    'Manufacturing': '🏭',
    'Retail': '🛍️'
  };
  return iconMap[industryName] || '🏢';
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_startups: 0,
    total_jobs: 0,
    total_industries: 0
  });
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [activeSlide, setActiveSlide] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Fetch real data from backend APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real statistics and data from your backend
        const [startupsRes, jobsRes, industriesRes] = await Promise.all([
          fetch('/startups/stats/').catch(() => ({ ok: false })),
          fetch('/jobs/stats/').catch(() => ({ ok: false })),
          fetch('/startups/industries/').catch(() => ({ ok: false }))
        ]);

        // Get real stats or fallback to defaults
        let totalStartups = 0;
        let totalJobs = 0;
        let totalIndustries = 0;

        if (startupsRes.ok) {
          const startupsData = await startupsRes.json();
          totalStartups = startupsData.total_startups || 0;
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          totalJobs = jobsData.total_jobs || 0;
        }

        if (industriesRes.ok) {
          const industriesData = await industriesRes.json();
          totalIndustries = industriesData.length || 0;
          setIndustries(industriesData.map(industry => ({
            id: industry.id,
            name: industry.name,
            icon: getIndustryIcon(industry.name),
            count: industry.startup_count || 0
          })));
        }

        setStats({
          total_startups: totalStartups,
          total_jobs: totalJobs,
          total_industries: totalIndustries
        });

        // Fetch featured startups
        const featuredRes = await fetch('/startups/?featured=true&limit=3').catch(() => ({ ok: false }));
        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedStartups(featuredData.results || []);
        }

        // Fetch recent jobs
        const recentJobsRes = await fetch('/jobs/?limit=3&ordering=-created_at').catch(() => ({ ok: false }));
        if (recentJobsRes.ok) {
          const recentJobsData = await recentJobsRes.json();
          setRecentJobs(recentJobsData.results || []);
        }

        // Set mock events for now (can be replaced with real events API later)
        setUpcomingEvents([
          {
            id: 1,
            title: "StartLinker Pitch Night",
            date: "July 25, 2025",
            time: "6:00 PM - 9:00 PM",
            location: "San Francisco, CA",
            isVirtual: false,
            description: "Watch 10 promising startups pitch to a panel of top investors."
          },
          {
            id: 2,
            title: "AI in Healthcare Webinar",
            date: "July 30, 2025",
            time: "1:00 PM - 2:30 PM",
            location: "Online",
            isVirtual: true,
            description: "Learn how artificial intelligence is transforming healthcare delivery and research."
          },
          {
            id: 3,
            title: "Fundraising Masterclass",
            date: "August 5, 2025",
            time: "10:00 AM - 12:00 PM",
            location: "Online",
            isVirtual: true,
            description: "Expert tips and strategies for early-stage startup fundraising."
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // Fallback to minimal data if API fails
        setStats({
          total_startups: 0,
          total_jobs: 0,
          total_industries: 0
        });
        setFeaturedStartups([]);
        setRecentJobs([]);
        setIndustries([]);
        setUpcomingEvents([]);
        setLoading(false);
      }
    };

    fetchData();

    // Auto-cycle through featured startups
    const interval = setInterval(() => {
      setActiveSlide(prevSlide => 
        prevSlide === featuredStartups.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000);
    
    // Scroll listener for navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [featuredStartups.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      return;
    }
    
    // Navigate to startups page with search
    if (user) {
      navigate('/startups', { state: { searchTerm } });
    } else {
      navigate('/auth', { state: { redirectTo: '/startups', searchTerm } });
    }
  };

  const handleExploreStartups = () => {
    if (user) {
      navigate('/startups');
    } else {
      navigate('/auth', { state: { redirectTo: '/startups' } });
    }
  };

  const handleBrowseJobs = () => {
    if (user) {
      navigate('/jobs');
    } else {
      navigate('/auth', { state: { redirectTo: '/jobs' } });
    }
  };

  const handleGetStarted = () => {
    navigate('/auth', { state: { showSignUp: true } });
  };

  const handleSignUp = () => {
    navigate('/auth', { state: { showSignUp: true } });
  };

  const handleLogin = () => {
    navigate('/auth', { state: { showSignUp: false } });
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const statCards = [
    {
      title: 'Innovative Startups',
      value: stats.total_startups.toLocaleString(),
      icon: <Building className="w-6 h-6" />,
      color: 'blue',
      description: 'Discover groundbreaking companies'
    },
    {
      title: 'Open Opportunities',
      value: stats.total_jobs.toLocaleString(),
      icon: <Briefcase className="w-6 h-6" />,
      color: 'green',
      description: 'Find your dream job in tech'
    },
    {
      title: 'Industry Categories',
      value: stats.total_industries.toLocaleString(),
      icon: <Award className="w-6 h-6" />,
      color: 'purple',
      description: 'Explore diverse sectors'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-6"></div>
          <h2 className="text-white text-2xl font-semibold mb-2">Loading StartLinker...</h2>
          <p className="text-blue-100">Connecting you to innovation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Page Navbar - Different from authenticated navbar */}
      <header className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled ? 'navbar-glass py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-xl hover-lift transition-all duration-300">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div className={`ml-4 transition-all duration-300 ${isScrolled ? '' : ''}`}>
                <span className={`text-2xl font-bold transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gradient' 
                    : 'text-white drop-shadow-lg'
                }`}>
                  StartLinker
                </span>
                <p className={`text-sm transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-500' 
                    : 'text-blue-100'
                }`}>
                  Innovation Ecosystem
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={handleExploreStartups}
                className={`transition-colors ${
                  isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
                }`}
              >
                Startups
              </button>
              <button 
                onClick={handleBrowseJobs}
                className={`transition-colors ${
                  isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
                }`}
              >
                Jobs
              </button>
              <button className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}>
                Events
              </button>
              <button className={`transition-colors ${
                isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
              }`}>
                About
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className={`hidden md:block px-6 py-2.5 rounded-xl border-2 transition-all duration-300 font-semibold hover-lift ${
                  isScrolled 
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300' 
                    : 'border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm'
                }`}
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover-lift shadow-lg hover:shadow-xl ${
                  isScrolled 
                    ? 'btn-premium' 
                    : 'bg-white text-blue-700 hover:bg-blue-50 shadow-white/20'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative gradient-mesh overflow-hidden pt-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-700/90 to-indigo-800/90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMDAwIiBvcGFjaXR5PSIuMDUiIGQ9Ik0wIDBoMTQ0MHY3NjBIMHoiLz48cGF0aCBkPSJNLTQ3MS41IDE5MS41YzAtMzMuMTM3IDI2Ljg2My02MCA2MC02MEg2OTQuNWMzMy4xMzcgMCA2MCAyNi44NjMgNjAgNjB2NjUxYzAgMzMuMTM3LTI2Ljg2MyA2MC02MCA2MEgtNDExLjVjLTMzLjEzNyAwLTYwLTI2Ljg2My02MC02MHYtNjUxeiIgc3Ryb2tlPSJ1cmwoI2EpIiBzdHJva2Utd2lkdGg9IjEuNSIgdHJhbnNmb3JtPSJyb3RhdGUoLTQzIC0yMzguNDMgNTg1LjQwMykiLz48cGF0aCBkPSJNLTIyMyAzNjljMC0zMy4xMzcgMjYuODYzLTYwIDYwLTYwaDEyMDZjMzMuMTM3IDAgNjAgMjYuODYzIDYwIDYwdjIyMGMwIDMzLjEzNy0yNi44NjMgNjAtNjAgNjBILTE2M2MtMzMuMTM3IDAtNjAtMjYuODYzLTYwLTYwVjM2OXoiIHN0cm9rZT0idXJsKCNiKSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKC00MyAtMjA2LjcyOSA1MTYuMjM0KSIvPjwvZz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkYiIHN0b3Atb3BhY2l0eT0iLjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkYiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkZGIiBzdG9wLW9wYWNpdHk9Ii40Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZGIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48L3N2Zz4=')] opacity-10"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-bounce-gentle"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-pulse-gentle"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-400/15 rounded-full blur-xl animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 relative z-10">
          <div className="text-center mb-16 animate-fadeInUp">
            <h1 className="hero-title text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Discover the Next Wave of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 animate-pulse-gentle">
                Innovation
              </span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed mb-12">
              Connect with cutting-edge startups, find your dream role, and be part of building the future. 
              Join the innovation ecosystem where ideas become reality.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <button 
                onClick={handleExploreStartups}
                className="btn-premium px-10 py-5 bg-white text-blue-700 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10">Explore Startups</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              <button 
                onClick={handleBrowseJobs}
                className="btn-outline px-10 py-5 glass text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 shadow-lg backdrop-blur-sm hover:-translate-y-2 hover:scale-105"
              >
                Browse Jobs
              </button>
            </div>
          </div>
          
          <div className="relative mt-20 max-w-5xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 transform rotate-1 rounded-3xl blur-xl"></div>
            <div className="relative glass-card p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Quick Search</h2>
                  <p className="text-gray-600">Find your next opportunity in seconds</p>
                </div>
                <div className="hidden md:flex items-center space-x-2 text-blue-600">
                  <Search className="w-5 h-5" />
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
              </div>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search startups, jobs, or industries..." 
                      className="search-enhanced w-full pl-12 pr-4 py-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-0 focus:border-blue-500 text-lg font-medium placeholder-gray-400 transition-all duration-300 hover:border-gray-300 hover:shadow-lg shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={searchCategory}
                      onChange={(e) => setSearchCategory(e.target.value)}
                      className="appearance-none w-full md:w-48 px-4 py-5 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-0 focus:border-blue-500 text-gray-700 font-medium transition-all duration-300 hover:border-gray-300 shadow-sm hover:shadow-lg"
                    >
                      <option value="all">All Categories</option>
                      <option value="startups">Startups</option>
                      <option value="jobs">Jobs</option>
                      <option value="industries">Industries</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-premium px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <span>Search</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500">Popular:</span>
                    <button 
                      type="button" 
                      onClick={() => setSearchTerm("AI Startups")}
                      className="filter-chip text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700 transition-colors"
                    >
                      AI Startups
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSearchTerm("Remote Jobs")}
                      className="filter-chip text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700 transition-colors"
                    >
                      Remote Jobs
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchTerm("FinTech");
                        setSearchCategory("industries");
                      }}
                      className="filter-chip text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700 transition-colors"
                    >
                      FinTech
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={toggleFilters}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    {showFilters ? 'Hide Filters' : 'Advanced Filters'}
                  </button>
                </div>
                
                {showFilters && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" style={{ color: '#374151' }}>
                        <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Location</option>
                        <option value="sf" style={{ color: '#111827', backgroundColor: '#ffffff' }}>San Francisco, CA</option>
                        <option value="nyc" style={{ color: '#111827', backgroundColor: '#ffffff' }}>New York, NY</option>
                        <option value="austin" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Austin, TX</option>
                        <option value="remote" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Remote Only</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" style={{ color: '#374151' }}>
                        <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>All Industries</option>
                        {industries.map(industry => (
                          <option key={industry.id} value={industry.id} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                            {industry.icon} {industry.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" style={{ color: '#374151' }}>
                        <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Any Size</option>
                        <option value="1-10" style={{ color: '#111827', backgroundColor: '#ffffff' }}>1-10 employees</option>
                        <option value="11-50" style={{ color: '#111827', backgroundColor: '#ffffff' }}>11-50 employees</option>
                        <option value="51-200" style={{ color: '#111827', backgroundColor: '#ffffff' }}>51-200 employees</option>
                        <option value="201+" style={{ color: '#111827', backgroundColor: '#ffffff' }}>201+ employees</option>
                      </select>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-gradient mb-6">The Fastest Growing Startup Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of founders, job-seekers, and investors building the future together
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statCards.map((card, index) => (
              <div 
                key={index} 
                className="startup-card p-8 text-center hover-lift animate-fadeInUp group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 mx-auto group-hover:animate-pulse-gentle`}>
                  <div className="text-white">{card.icon}</div>
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-3">{card.value}</h3>
                <p className="text-xl font-semibold text-gray-700 mb-2">{card.title}</p>
                <p className="text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Startups Section */}
      <div className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 animate-fadeInUp">
            <div>
              <h2 className="text-4xl font-bold text-gradient mb-4">Featured Startups</h2>
              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                Discover innovative companies that are changing the world and defining the future
              </p>
            </div>
            <button 
              onClick={handleExploreStartups}
              className="btn-outline px-6 py-3 flex items-center gap-2 hover-lift"
            >
              View All
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Featured Startup Spotlight */}
            <div className="gradient-primary rounded-3xl overflow-hidden shadow-2xl hover-lift animate-fadeInLeft">
              {featuredStartups.length > 0 && (
                <div className="p-10 text-white relative h-full">
                  <div className="absolute right-10 top-10 text-7xl animate-bounce-gentle">
                    {featuredStartups[activeSlide].logo}
                  </div>
                  <span className="badge-premium mb-6">
                    ⭐ Featured Startup
                  </span>
                  <h3 className="text-4xl font-bold mb-3">{featuredStartups[activeSlide].name}</h3>
                  <p className="text-blue-100 text-lg mb-6">{featuredStartups[activeSlide].industry_name}</p>
                  <p className="text-xl text-blue-50 mb-8 max-w-md leading-relaxed">
                    {featuredStartups[activeSlide].description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="glass rounded-2xl p-6 hover-scale">
                      <div className="flex items-center text-blue-100 mb-2">
                        <TrendingUp className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Growth</span>
                      </div>
                      <div className="text-2xl font-bold">{featuredStartups[activeSlide].growth_rate}</div>
                    </div>
                    <div className="glass rounded-2xl p-6 hover-scale">
                      <div className="flex items-center text-blue-100 mb-2">
                        <DollarSign className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Funding</span>
                      </div>
                      <div className="text-2xl font-bold">{featuredStartups[activeSlide].funding_amount}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 text-sm">
                      <MapPin className="w-5 h-5" />
                      <span className="font-medium">{featuredStartups[activeSlide].location}</span>
                      <span className="text-blue-200">•</span>
                      <Users className="w-5 h-5" />
                      <span className="font-medium">{featuredStartups[activeSlide].employee_count} employees</span>
                    </div>
                    <div className="flex space-x-2">
                      {featuredStartups.map((_, index) => (
                        <button 
                          key={index}
                          onClick={() => setActiveSlide(index)}
                          className={`h-3 rounded-full transition-all hover-scale ${
                            index === activeSlide ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`View startup ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Recent Jobs */}
            <div className="startup-card animate-fadeInRight" style={{ animationDelay: '0.2s' }}>
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-gradient mb-2">Latest Opportunities</h3>
                    <p className="text-gray-600">Hot jobs from innovative companies</p>
                  </div>
                  <button 
                    onClick={handleBrowseJobs}
                    className="btn-outline px-6 py-3 flex items-center gap-2 hover-lift"
                  >
                    View All
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {recentJobs.map((job, index) => (
                    <div 
                      key={job.id} 
                      className="job-card p-6 cursor-pointer group animate-fadeInUp hover-lift"
                      onClick={handleBrowseJobs}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-gradient transition-all mb-1">{job.title}</h4>
                          <p className="text-gray-600 font-medium mb-3">{job.startup_name}</p>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="badge-featured">
                              {job.job_type_name}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.location}
                            </span>
                            {job.is_remote && (
                              <span className="badge-new">
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500 mb-2">{job.posted_ago}</p>
                          {job.is_urgent && (
                            <span className="badge-hot">
                              🔥 Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <button 
                    onClick={handleBrowseJobs}
                    className="btn-premium px-8 py-4 rounded-2xl"
                  >
                    Find Your Next Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 animate-fadeInUp">
            <div>
              <h2 className="text-4xl font-bold text-gradient mb-4">Upcoming Events</h2>
              <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
                Connect with the startup community through virtual and in-person events
              </p>
            </div>
            <button className="btn-outline px-6 py-3 flex items-center gap-2 hover-lift">
              View All Events
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {upcomingEvents.map((event, index) => (
              <div 
                key={event.id}
                className="startup-card hover-lift animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-2 ${event.isVirtual ? 'gradient-secondary' : 'gradient-success'}`}></div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 pr-4">{event.title}</h3>
                    <span className={`badge-${event.isVirtual ? 'premium' : 'new'} whitespace-nowrap`}>
                      {event.isVirtual ? '🌐 Virtual' : '📍 In-Person'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{event.description}</p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="font-medium">{event.date} • {event.time}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                      <span className="font-medium">{event.location}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSignUp}
                    className="btn-premium w-full px-6 py-4 rounded-xl flex items-center justify-center gap-3"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industry Exploration Section */}
      <div className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-gradient mb-6">Explore by Industry</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover startups and jobs across different sectors
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {industries.map((industry, index) => (
              <button 
                key={industry.id}
                onClick={handleExploreStartups}
                className="startup-card p-8 text-center hover-lift group animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="text-5xl mb-4 group-hover:animate-bounce-gentle">{industry.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-gradient transition-all">{industry.name}</h3>
                <p className="text-gray-600 font-medium">{industry.count} startups</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-gradient mb-6">Why Choose StartLinker</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The complete platform for startup discovery, networking, and growth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center animate-fadeInUp group" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-gentle hover-lift">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gradient transition-all">Startup Discovery</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Find and connect with innovative startups across all industries. Get detailed insights into their growth, funding, and vision.
              </p>
            </div>
            
            <div className="text-center animate-fadeInUp group" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 gradient-success rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-gentle hover-lift">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gradient transition-all">Career Opportunities</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Explore thousands of jobs at the most exciting companies. Find remote, hybrid, or on-site roles that match your skills and aspirations.
              </p>
            </div>
            
            <div className="text-center animate-fadeInUp group" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 gradient-secondary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:animate-pulse-gentle hover-lift">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gradient transition-all">Industry Insights</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Stay updated with the latest trends, funding rounds, and innovations. Get data-driven insights to make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-24 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBmaWxsPSIjMDAwIiBvcGFjaXR5PSIuMDUiIGQ9Ik0wIDBoMTQ0MHY3NjBIMHoiLz48cGF0aCBkPSJNLTQ3MS41IDE5MS41YzAtMzMuMTM3IDI2Ljg2My02MCA2MC02MEg2OTQuNWMzMy4xMzcgMCA2MCAyNi44NjMgNjAgNjB2NjUxYzAgMzMuMTM3LTI2Ljg2MyA2MC02MCA2MEgtNDExLjVjLTMzLjEzNyAwLTYwLTI2Ljg2My02MC02MHYtNjUxeiIgc3Ryb2tlPSJ1cmwoI2EpIiBzdHJva2Utd2lkdGg9IjEuNSIgdHJhbnNmb3JtPSJyb3RhdGUoLTQzIC0yMzguNDMgNTg1LjQwMykiLz48cGF0aCBkPSJNLTIyMyAzNjljMC0zMy4xMzcgMjYuODYzLTYwIDYwLTYwaDEyMDZjMzMuMTM3IDAgNjAgMjYuODYzIDYwIDYwdjIyMGMwIDMzLjEzNy0yNi44NjMgNjAtNjAgNjBILTE2M2MtMzMuMTM3IDAtNjAtMjYuODYzLTYwLTYwVjM2OXoiIHN0cm9rZT0idXJsKCNiKSIgc3Ryb2tlLXdpZHRoPSIxLjUiIHRyYW5zZm9ybT0icm90YXRlKC00MyAtMjA2LjcyOSA1MTYuMjM0KSIvPjwvZz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkYiIHN0b3Atb3BhY2l0eT0iLjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkYiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkZGIiBzdG9wLW9wYWNpdHk9Ii40Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkZGIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48L3N2Zz4=')] opacity-10"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-bounce-gentle"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-pulse-gentle"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 animate-fadeInUp">
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Ready to Discover Your Next{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Opportunity?
            </span>
          </h2>
          <p className="text-2xl text-blue-100 max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of professionals connecting with innovative startups and finding their dream roles.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleSignUp}
              className="px-12 py-5 bg-white text-blue-700 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-2 hover:scale-105"
            >
              Create Account
            </button>
            <button 
              onClick={handleExploreStartups}
              className="px-12 py-5 glass text-white border-2 border-white/30 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all duration-300 shadow-lg backdrop-blur-sm hover:-translate-y-2 hover:scale-105"
            >
              Explore Platform
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Logo className="w-10 h-10" />
                <div>
                  <h3 className="text-xl font-bold text-white">StartLinker</h3>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                Connecting talent with opportunity in the startup ecosystem.
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><button onClick={handleExploreStartups} className="text-gray-400 hover:text-white transition-colors">Startups</button></li>
                <li><button onClick={handleBrowseJobs} className="text-gray-400 hover:text-white transition-colors">Jobs</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Investors</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Events</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Insights</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><button className="text-gray-400 hover:text-white transition-colors">Blog</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Help Center</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Guides</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Community</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Podcast</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><button className="text-gray-400 hover:text-white transition-colors">About Us</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Careers</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Press</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Contact</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Partnerships</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 StartLinker. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <button className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</button>
              <button className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</button>
              <button className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}